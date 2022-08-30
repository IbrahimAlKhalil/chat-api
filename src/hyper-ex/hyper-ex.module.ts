import { InternalServerError } from '../exceptions/internal-server-error.js';
import HyperExpress, { MiddlewareHandler } from 'hyper-express';
import { BaseException } from '../exceptions/base-exception.js';
import { Unauthorized } from '../exceptions/unauthorized.js';
import { Request, Response, Websocket } from '../types/uws';
import { BadRequest } from '../exceptions/bad-request.js';
import { AuthService } from '../auth/auth.service.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthModule } from '../auth/auth.module.js';
import { UserRouteHandler } from 'hyper-express';
import { Logger, Module } from '@nestjs/common';
import { Config } from '../config/config.js';
import { HyperEx } from './hyper-ex.js';
import helmet from 'helmet';
import cors from 'cors';
import Joi from 'joi';

@Module({
  imports: [AuthModule],
  providers: [
    {
      provide: HyperEx,
      useValue: new HyperExpress.Server({
        max_body_length: 1e8,
        trust_proxy: true,
      }),
    },
  ],
  exports: [HyperEx],
})
export class HyperExModule {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly authService: AuthService,
    private readonly hyperEx: HyperEx,
    private readonly config: Config,
  ) {
    this.initHttp();
    this.initWs();
  }

  public readonly onlineUsers = new Set<number>();
  private readonly logger = new Logger(HyperExModule.name);
  private readonly messageSchema = Joi.array().items(
    Joi.string().valid('join', 'leave'),
    Joi.number().min(0),
  );

  private initHttp() {
    const corsMiddleware = cors({
      origin: [this.config.app.origin],
      methods: ['GET', 'POST', 'UPDATE', 'DELETE', 'OPTIONS', 'HEAD'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Accept-Language',
        'Origin',
      ],
      exposedHeaders: ['Content-Type'],
      credentials: true,
      maxAge: 3600,
      preflightContinue: true,
    }) as UserRouteHandler;
    const helmetMiddleware = helmet({
      crossOriginResourcePolicy: {
        policy: 'cross-origin',
      },
      contentSecurityPolicy: false,
    }) as unknown as MiddlewareHandler;

    this.hyperEx.use(helmetMiddleware);
    this.hyperEx.use(corsMiddleware);

    this.hyperEx.options(
      '/*',
      {
        middlewares: [corsMiddleware],
      },
      (req: HyperExpress.Request, res: HyperExpress.Response) => {
        res.send();
      },
    );

    this.hyperEx.set_error_handler((req, res, err) => {
      if (
        err instanceof InternalServerError ||
        !(err instanceof BaseException)
      ) {
        res.status(500).json({
          status: 500,
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Something went wrong, please try again later.',
        });

        this.logger.error(err);
      } else {
        res.status(err.status).json({
          status: err.status,
          code: err.code,
          message: err.message,
          details: err.details,
        });
      }
    });

    this.hyperEx.get('/online-users', async (req, res) => {
      await this.authService.authenticateReq(req);

      res.json(Array.from(this.onlineUsers));
    });

    this.hyperEx.listen(this.config.app.port, this.config.app.host).then(() => {
      this.logger.log(
        `HTTP and Websocket server started at ${this.config.app.host}:${this.config.app.port}`,
      );
    });
  }

  private initWs() {
    const { websocket } = this.config;
    const path = '/ws/:token';

    this.hyperEx.uws_instance.ws(path, {
      compression: HyperExpress.compressors.SHARED_COMPRESSOR,
      maxPayloadLength: websocket.maxPayloadLength,
      idleTimeout: websocket.idleTimeout,
      maxBackpressure: websocket.maxBackpressure,
      upgrade: this.handleUpgrade.bind(this),
      message: this.handleMessage.bind(this),
      close: this.handleClose.bind(this),
    });
  }

  private async handleUpgrade(
    res: Response,
    req: Request,
    context: HyperExpress.compressors.us_socket_context_t,
  ) {
    // Extract necessary data before the request object is gone
    const token = req.getParameter(0);
    const secWebSocketKey = req.getHeader('sec-websocket-key');
    const secWebSocketProtocol = req.getHeader('sec-websocket-protocol');
    const secWebSocketExtensions = req.getHeader('sec-websocket-extensions');
    let aborted = false;

    res.onAborted(() => {
      aborted = true;
    });

    // Authenticate the request
    try {
      const uid = await this.authService.authenticate(token);

      if (aborted) {
        return;
      }

      // Authenticated and not aborted, upgrade the connection
      res.upgrade(
        { uid },
        secWebSocketKey,
        secWebSocketProtocol,
        secWebSocketExtensions,
        context,
      );

      this.onlineUsers.add(uid);
    } catch (e) {
      res
        .writeStatus('401')
        .writeHeader('Content-Type', 'application/json')
        .end(
          JSON.stringify({
            status: 401,
            code: 'UNAUTHORIZED',
            message: 'You are not authorized to make this request',
          }),
        );
    }
  }

  private async handleMessage(
    ws: Websocket,
    msg: ArrayBuffer,
    isBinary: boolean,
  ) {
    if (isBinary) {
      return this.handleError(ws, new BadRequest('Binary is not supported'));
    }

    // Convert ArrayBuffer to string
    const msgTxt = Buffer.from(msg).toString('utf-8');

    // Try to parse the message as JSON
    let msgObj: Record<string, any>;

    try {
      msgObj = JSON.parse(msgTxt);
    } catch (e) {
      return this.handleError(ws, e);
    }

    // Validate the message
    let value: ['join' | 'leave', number];

    try {
      value = await this.messageSchema.validateAsync(msgObj);
    } catch (e) {
      return this.handleError(ws, e);
    }

    if (value[0] === 'leave') {
      return ws.unsubscribe(value[1].toString());
    }

    if (value[1] === 0) {
      return ws.subscribe('0');
    }

    try {
      await this.authService.authorize(ws.uid, value[1]);

      ws.subscribe(value[1].toString());
    } catch (e) {
      this.handleError(
        ws,
        new Unauthorized(
          `You are not allowed to join conversation #${value[1]}`,
        ),
      );
    }
  }

  private async handleError(ws: Websocket, err: Error) {
    if (err instanceof InternalServerError || !(err instanceof BaseException)) {
      ws.send(
        JSON.stringify([
          'error',
          {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Something went wrong, please try again later.',
          },
        ]),
      );

      this.logger.error(err);
    } else {
      ws.send(
        JSON.stringify([
          'error',
          {
            code: err.code,
            message: err.message,
            details: err.details,
          },
        ]),
      );
    }
  }

  private async handleClose(ws: Websocket) {
    this.onlineUsers.delete(ws.uid);
  }
}
