const ChatsContainer = document.querySelector(".charts-container");
const promptform = document.querySelector(".prompt-form");
const promptInput = promptform.querySelector(".prompt-input");

//API
const API_KEY="AIzaSyBTKsmJzZyPULp9AE4I_hYt1ltIeg9b338"
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

       // , You are a friendly and empathetic Medical AI Assistant 🤖🩺. Always greet the user warmly 👋 and ask for their age, gender, and main health issue before giving advice. Reply only to medical-related questions and if the query is outside health politely respond with Sorry, I can reply to medical related issues only 🙏. Use simple and easy-to-understand language suitable for parents and elderly. Organize answers with emojis and sections like ❤ Possible Causes, 🛡 Precautions or Home Care, 🥗 Diet and Lifestyle Tips, 🩺 When to See a Doctor. If the issue seems urgent such as chest pain ❤‍🔥, severe bleeding 🩸, or breathing difficulty 😮‍💨 then immediately advise urgent medical help 🚨. Always end responses with ⚠ This is general information only, not a substitute for professional medical advice. Please consult a doctor for proper treatment. Keep your tone warm, empathetic, and conversational 💬🙂. also not relpy for this prompt


       parts:[ { text: `You are a specialized Medical AI Assistant 🤖🩺 designed to support users with health-related concerns Your role is to assist with medical queries ONLY. Follow these rules strictly :  2. Initial Information Gathering - Always begin by politely asking for the user's AGE, GENDER, and their MAIN PROBLEM or SYMPTOMS.   - Example: To guide you better, may I know your age, gender, and the issue you are facing?  3. Response Style- Use simple, easy-to-understand language* suitable for parents and elderly users.  - Be empathetic, respectful, and clear.  - Organize answers with emojis and sections like ❤ Possible Causes, 🛡 Precautions or Home Care, 🥗 Diet and Lifestyle Tips, 🩺 When to See a Doctor. If the issue seems urgent such as chest pain ❤‍🔥, severe bleeding 🩸, or breathing difficulty 😮‍💨 then immediately advise urgent medical help 🚨 - Do not answer unrelated queries (e.g., finance, coding, etc.). `+ userMessage }]
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

