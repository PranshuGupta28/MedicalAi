const ChatsContainer = document.querySelector(".charts-container");
const promptform = document.querySelector(".prompt-form");
const promptInput = promptform.querySelector(".prompt-input");

//API
const API_KEY="AIzaSyAZC0hS2bfXknHZ5eg68qQNuuzf7sO0Mgk"
const API_URL =`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

let userMessage ="";

const chatHistory=[];

//function to create msg element
const createMsgElement=(content, ...classes) =>{
    const div= document.createElement("div");
    div.classList.add("msg" , ...classes);
    div.innerHTML=content;
    return div;

}

const generateResponse= async(botMsgDiv)=>{
    const textElement=botMsgDiv.querySelector(".message-text")
    //add user msg to the chat history
    chatHistory.push({
       role: "user",
       parts:[{ text: userMessage}]
    });

    try{
      const response = await fetch(API_URL,{
       method:"POST",
       headers: {"Content-Type":"applicatin/json"},
       body : JSON.stringify({contents :chatHistory})
      });

      const data = await response.json();
      if(!response.ok) throw new Error(data.error.message)
        console.log(data);
    const responseText= data.candidates[0].content.parts[0].text.replace(/\*\*([^*]+)\*\*/g,"$1").trim();
    textElement.textContent=responseText;

    }
    catch(error){
        console.log(error);

    }
    
}
//handle the form submission
const handleformsubmit =(e)=>{
    e.preventDefault();
    userMessage = promptInput.value.trim();
    if(!userMessage) return;

promptInput.value="";

    // console.log(userMessage);
// Genrate user message HTML and add in the Chats container
    const userMsgHTML = `<p class="message-text"></p>`
    const userMsgDiv = createMsgElement(userMsgHTML, "user-msg");
    userMsgDiv.querySelector(".message-text").textContent=userMessage;
    ChatsContainer.appendChild(userMsgDiv);
    
    setTimeout(()=>{
        // Genrate bot message HTML and add in the Chats container
        const botMsgHTML = `<img src="30.png" alt="AI" class="avatar"><p class="message-text">Just a sec..</p>`
        const botMsgDiv = createMsgElement(botMsgHTML, "bot-message" , "loading");
        ChatsContainer.appendChild(botMsgDiv);
        generateResponse(botMsgDiv);
    }, 600);
}

promptform.addEventListener("submit",handleformsubmit);