export default {
  props: ['users', 'title', 'btn-text'],
  template: `
   <div class='min-w-'>
     <h4 class='mb-2 text-2xl'>{{ title }}: </h4>
   
     <table class='border-2'>
       <thead>
         <tr>
           <th class='p-2'>ID</th>
           <th class='p-2'>Name</th>
           <th class='p-2'>Token</th>
           <th class='p-2'>#</th>
         </tr>
       </thead>
       <tbody v-if='users'>
         <tr v-for='user in users' class='border-2'>
           <td class='p-2'>{{ user.id }}</td>
           <td class='p-2'>{{ user.name }}</td>
           <td class='p-2'>{{ user.token }}</td>
           <td class='p-2'>
             <a href='#' @click.prevent='$emit("action", user)' class='text-blue-500 underline'>{{ btnText }}</a>
           </td>
         </tr>
       </tbody>
     </table>
   </div>
`,
};