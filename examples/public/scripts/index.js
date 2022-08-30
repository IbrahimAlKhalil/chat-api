import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import messages from './messages.js';
import { Chat } from './chat.js';
import users from './users.js';

let chat;

const app = createApp({
  components: { users, messages },
  data() {
    return {
      user: null,
      users: null,
      onlineUsers: [],
      messages: [],
    };
  },
  methods: {
    async login(user) {
      this.logout();

      this.user = user;

      if (!this.user) {
        return alert('Invalid user token');
      }

      const userIds = await fetch('http://localhost:7000/online-users', {
        headers: {
          Authorization: `Bearer ${this.user.token}`,
        },
      }).then(res => res.json());

      for (const uid of userIds) {
        if (this.onlineUsers.some(user => user.id === uid)) {
          continue;
        }

        this.onlineUsers.push(this.users.find(user => user.id === uid));
      }

      chat = new Chat('http://localhost:7000/ws', this.user.token);

      chat.subscribe(0, (data) => {
        const user = this.users.find(user => user.id === data.uid);

        if (data.type === 'in') {
          this.onlineUsers.push(user);
        } else {
          this.onlineUsers.splice(this.onlineUsers.indexOf(user), 1);
        }
      });
    },

    logout() {
      this.user = null;

      if (chat) {
        chat.dispose();
      }
    },

    chat(user) {
      console.log(user);
    }
  },
  async mounted() {
    this.users = await fetch('/users').then(res => res.json());
  },
  template: `
    <div class='flex justify-between'>
      <div v-if='users'>
        <div v-if='user'>Logged in as: {{ user.name }}</div>
      
        <button v-if='user' @click='logout' class='border-2 p-1 rounded border-slate-500 bg-slate-500 text-white mx-2 active:bg-slate-600'>Logout</button>
      </div>
    </div>

    <hr class='block my-3'>

    <div class='flex justify-evenly mb-2'>
      <users :users='users' title='Available Users' @action='login' btn-text='Login'></users>
      
      <users :users='onlineUsers' title='Online Users' @action='chat' btn-text='Chat'></users>
      
      <messages :messages='messages'></messages>
    </div>
  `,
}).mount('#app');