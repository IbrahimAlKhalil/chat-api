export default {
  props: ['users', 'chat'],
  data() {
    return {
      model: {
        type: null,
        name: null,
        members: null,
      },
      conversations: [],
    }
  },
  watch: {
    chat() {
      this.init();
    }
  },
  methods: {
    create() {
      this.chat.conversations.create(
        this.model.type,
        this.model.members,
        this.model.name
      );
    },
    init() {
      this.chat.conversations.subscribe((event) => {
        if (event.type === 'read') {
          this.conversations = this.conversations.concat(event.items);
        } else if (event.type === 'create') {
          this.conversations.unshift(...event.items);
        } else {
          for (const item of event.items) {
            const index = this.conversations.findIndex(conversation => conversation === item);

            this.conversations.splice(index, 1);
          }
        }
      });

      this.chat.onDispose(() => {
        this.conversations = [];
      });
    }
  },
  created() {
    this.init();
  },
  template: `
   <fieldset class='border border-solid border-gray-300 p-3'>
      <legend>Conversations</legend>
      <div class='flex gap-4'>
        <table class='border-2 w-full text-center'>
          <thead>
            <tr>
              <th class='p-2'>ID</th>
              <th class='p-2'>Name</th>
              <th class='p-2'>Type</th>
              <th class='p-2'>Last Active</th>
              <th class='p-2'>Created At</th>
              <th class='p-2'>#</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for='conversation in conversations' class='border-2'>
              <td class='p-2'>{{ conversation.raw.id }}</td>
              <td class='p-2'>{{ conversation.raw.name }}</td>
              <td class='p-2'>{{ conversation.raw.type }}</td>
              <td class='p-2'>{{ conversation.raw.last_active_at }}</td>
              <td class='p-2'>{{ conversation.raw.created_at }}</td>
              <td class='p-2'>
                <a href='#' @click.prevent='open' class='text-blue-500 underline'>Open</a>
              </td>
            </tr>
          </tbody>
        </table>
        <form class='w-2/5 border-2 p-4 flex flex-wrap' @submit.prevent='create'>
          <select v-model='model.type' class='border border-2 p-2 rounded mb-3 cursor-pointer w-full' required>
            <option :value='null'>--- Type ---</option>
            <option value='dm'>Direct Message</option>
            <option value='group'>Group</option>
          </select>
          <input v-if='model.type==="group"' v-model='model.name' placeholder='Name' class='border border-2 mb-3 p-2 rounded w-full' required/>
          <select v-if='model.type' v-model='model.members' class='border border-2 p-2 rounded mb-3 cursor-pointer w-full' :multiple='model.type==="group"' required>
            <option :value='null' key='null'>--- Members ---</option>
            <option v-for='user in users' :value='user.id' :key='user.id'>{{ user.name }}</option>
          </select>
          <button type='submit' class='border-2 p-2 rounded bg-blue-500 active:bg-blue-600 text-white mx-auto'>Create Conversation</button>
        </form>
      </div>
   </fieldset>
`,
};