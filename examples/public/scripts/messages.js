export default {
  props: ['messages'],
  data() {
    return {
      input: null,
    }
  },
  template: `
   <div class='p-4 w-[40%] max-h-screen'>
     <div class='my-1 border-2'>
       <div v-for='message in messages'>
         <b>{{ message.user.name }}:</b> {{ message.metadata }}
       </div>
     </div>
     
     <input id='token' v-model='token' class='border-2 p-1 rounded border-slate-500' placeholder='Write something...'>
     <button @click='$emit("message", input)' class='border-2 p-1 rounded border-slate-500 bg-slate-500 text-white mx-2 active:bg-slate-600'>Send</button>
   </div>
`,
};