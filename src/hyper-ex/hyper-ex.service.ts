import { InternalServerError } from '../exceptions/internal-server-error.js';
import HyperExpress, { MiddlewareHandler, Server } from 'hyper-express';
import { BaseException } from '../exceptions/base-exception.js';
import { Injectable, Logger } from '@nestjs/common';
import { UserRouteHandler } from 'hyper-express';
import { Config } from '../config/config.js';
import helmet from 'helmet';
import cors from 'cors';

@Injectable()
export class HyperExService extends Server {
  constructor(private readonly config: Config) {
    super({
      auto_close: true,
      fast_abort: true,
      fast_buffers: true,
      max_body_length: 1e8,
      trust_proxy: true,
    });

    const corsMiddleware = cors({
      origin: [config.app.origin],
      methods: ['GET', 'POST', 'UPDATE', 'DELETE', 'OPTIONS', 'HEAD'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Accept-Language',
        'Origin',
        'X-Csrf-Token',
        'Cookie',
        'X-Qm-Institute-Id',
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

    this.use(helmetMiddleware);
    this.use(corsMiddleware);

    this.options(
      '/*',
      {
        middlewares: [corsMiddleware],
      },
      (req: HyperExpress.Request, res: HyperExpress.Response) => {
        res.send();
      },
    );

    this.set_error_handler((req, res, err) => {
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

    this.uws_instance.listen(config.app.host, config.app.port, () => {
      this.logger.log(
        `HTTP and Websocket server started at ${config.app.host}:${config.app.port}`,
      );
    });
  }

  private logger = new Logger(HyperExService.name);
}
