export default {
  props: ['users'],
  data() {
    return {
      currentUser: null,
    }
  },
  methods: {
    login(user) {
      this.currentUser = user;
      this.$emit('login', user);
    },
    logout() {
      this.currentUser = null;
      this.$emit('logout');
    }
  },
  template: `
   <fieldset class='border border-solid border-gray-300 p-3'>
     <legend>Users</legend>
     <table class='border-2 w-full text-center'>
       <thead>
         <tr>
           <th class='p-2'>ID</th>
           <th class='p-2'>Name</th>
           <th class='p-2'>Token</th>
           <th class='p-2'>Status</th>
           <th class='p-2'>#</th>
         </tr>
       </thead>
       <tbody v-if='users'>
         <tr v-for='user in users' class='border-2'>
           <td class='p-2'>{{ user.id }}</td>
           <td class='p-2'>{{ user.name }}</td>
           <td class='p-2'>{{ user.token }}</td>
           <td class='p-2'>
             <span class='text-green-400' v-if='user.online || user === currentUser'>Online</span>
             <span class='text-zinc-400' v-else>Offline</span>
           </td>
           <td class='p-2'>
             <a v-if='user !== currentUser' href='#' @click.prevent='login(user)' class='text-blue-500 underline'>Login</a>
             <a v-else href='#' @click.prevent='logout' class='text-red-500 underline'>Logout</a>
           </td>
         </tr>
       </tbody>
     </table>
   </fieldset>
`,
};