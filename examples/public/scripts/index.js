import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import conversations from './conversations.js';
import { Chat } from './chat/chat.js';
import messages from './messages.js';
import users from './users.js';

const app = createApp({
  components: { users, messages, conversations },
  data() {
    return {
      user: null,
      users: null,
    };
  },
  computed: {
    usersExceptMe() {
      if (!this.users) {
        return [];
      }

      if (!this.user) {
        return this.users;
      }

      return this.users.filter(user => user.id !== this.user.id);
    },
    chat() {
      if (!this.user) {
        return null;
      }

      return new Chat('http://localhost:7000', this.user.token, this.user.id);
    }
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
        const user = this.users.find(_user => _user.id === uid);

        if (user) {
          user.online = true;
        }
      }

      this.chat.onUser( (data) => {
        const user = this.users.find(user => user.id === data.uid);
        user.online = data.online;
      });
    },

    logout() {
      if (this.user) {
        this.user.online = false;
      }

      if (this.chat) {
        this.chat.dispose();

        this.user = null;
      }
    },
  },
  async mounted() {
    this.users = await fetch('/users').then(res => res.json());
  },
  template: `
    <users :users='users' @login='login' @logout='logout'/>
    <conversations v-if='user' class='mt-4' :users='usersExceptMe' :chat='chat'/>
  `,
}).mount('#app');