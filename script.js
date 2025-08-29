const Container = document.querySelector(".container");
const ChatsContainer = document.querySelector(".charts-container");
const promptform = document.querySelector(".prompt-form");
const promptInput = promptform.querySelector(".prompt-input");

// API Configuration
const API_KEY = "AIzaSyBTKsmJzZyPULp9AE4I_hYt1ltIeg9b338";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

let userMessage = "";
let userAge = null;
let userGender = null;
let hasInitialInfo = false;
let uploadedFile = null; // Store uploaded file data
let isWaitingForFileQuestion = false; // Flag to track if we're waiting for a question about uploaded file

const chatHistory = [];

// Theme Management
const initializeTheme = () => {
    const savedTheme = localStorage.getItem('medical-ai-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
};

const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('medical-ai-theme', newTheme);
    updateThemeIcon(newTheme);
    
    // Add smooth transition
    document.body.style.transition = 'all 0.3s ease';
    setTimeout(() => {
        document.body.style.transition = '';
    }, 300);
};

const updateThemeIcon = (theme) => {
    const themeBtn = document.querySelector('#theme-toggle-btn');
    if (themeBtn) {
        const icon = themeBtn.querySelector('.material-icons');
        if (icon) {
            icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
        }
    }
};

// Utility Functions
const createMsgElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("msg", ...classes);
    div.innerHTML = content;
    return div;
};

const scrollToBottom = () => ChatsContainer.scrollTo({top: ChatsContainer.scrollHeight, behavior: "smooth"});

const typingEffect = (text, textElement, botMsgDiv) => {
    textElement.textContent = " ";
    const words = text.split(" ");
    let wordIndex = 0;
    
    const typingInterval = setInterval(() => {
        if (wordIndex < words.length) {
            textElement.textContent += (wordIndex === 0 ? "" : " ") + words[wordIndex++];
            botMsgDiv.classList.remove("loading");
            scrollToBottom();
        } else {
            clearInterval(typingInterval);
        }
    }, 40);
};

// File Processing Functions
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const getMimeType = (file) => {
    return file.type || 'application/octet-stream';
};

const isImageFile = (file) => {
    return file.type.startsWith('image/');
};

const isPdfFile = (file) => {
    return file.type === 'application/pdf';
};

const isTextFile = (file) => {
    const textTypes = ['text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    return textTypes.includes(file.type);
};

// Enhanced Response Generation
// const generateResponse = async (botMsgDiv) => {
//     const textElement = botMsgDiv.querySelector(".message-text");
//     let promptText;
//     let requestBody = { contents: [] };

//     try {
//         if (!hasInitialInfo) {
//             promptText = `You are a specialized Medical AI Assistant 🤖🩺 designed to support users with health-related concerns. Your role is to assist with medical queries ONLY. Follow these rules strictly: 2. Initial Information Gathering - Always begin by politely asking for the user's AGE, GENDER, and their MAIN PROBLEM or SYMPTOMS. - Example: To guide you better, may I know your age, gender, and the issue you are facing? 3. Response Style - Use simple, easy-to-understand language suitable for parents and elderly users. - Be empathetic, respectful, and clear. - Organize answers with emojis and sections like ❤ Possible Causes, 🛡 Precautions or Home Care, 🥗 Diet and Lifestyle Tips, 🩺 When to See a Doctor. If the issue seems urgent such as chest pain ❤️‍🔥, severe bleeding 🩸, or breathing difficulty 😮‍💨 then immediately advise urgent medical help 🚨 - Do not answer unrelated queries (e.g., finance, coding, etc.). User message: ${userMessage}`;
//         } else {
//             promptText = `You are a specialized Medical AI Assistant 🤖🩺 designed to support users with health-related concerns. Your role is to assist with medical queries ONLY.
            
//             Response Style - Use simple, easy-to-understand language suitable for parents and elderly users. - Be empathetic, respectful, and clear. - Organize answers with emojis and sections like ❤ Possible Causes, 🛡 Precautions or Home Care, 🥗 Diet and Lifestyle Tips, 🩺 When to See a Doctor. If the issue seems urgent such as chest pain ❤️‍🔥, severe bleeding 🩸, or breathing difficulty 😮‍💨 then immediately advise urgent medical help 🚨 - Do not answer unrelated queries (e.g., finance, coding, etc.).
            
//             The user's age is ${userAge} and their gender is ${userGender}. User message: "${userMessage}"`;
//         }

//         // Prepare content array
//         let contentArray = [];

//         // Add file data if available and user asked a question
//         if (uploadedFile && userMessage.trim()) {
//             if (isImageFile(uploadedFile.file)) {
//                 contentArray.push({
//                     inlineData: {
//                         mimeType: uploadedFile.file.type,
//                         data: uploadedFile.base64Data
//                     }
//                 });
//                 contentArray.push({ 
//                     text: `${promptText}\n\nPlease analyze this medical image and answer the user's question: "${userMessage}". Provide medical insights while reminding the user to consult a healthcare professional for proper diagnosis.` 
//                 });
//             } else if (isPdfFile(uploadedFile.file)) {
//                 contentArray.push({
//                     inlineData: {
//                         mimeType: uploadedFile.file.type,
//                         data: uploadedFile.base64Data
//                     }
//                 });
//                 contentArray.push({ 
//                     text: `${promptText}\n\nPlease analyze this medical document/report and answer the user's question: "${userMessage}". Provide medical insights and explain any medical terms in simple language.` 
//                 });
//             } else {
//                 contentArray.push({ text: promptText });
//             }
            
//             // Clear uploaded file after processing
//             uploadedFile = null;
//             isWaitingForFileQuestion = false;
//         } else {
//             contentArray.push({ text: promptText });
//         }

//         // Add to chat history and make request
//         chatHistory.push({
//             role: "user",
//             parts: contentArray
//         });

//         requestBody.contents = chatHistory;

//         const response = await fetch(API_URL, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(requestBody)
//         });

//         const data = await response.json();
//         if (!response.ok) throw new Error(data.error?.message || 'API request failed');

//         console.log(data);
        
//         const responseText = data.candidates[0].content.parts[0].text.replace(/\*\*([^*]+)\*\*/g, "$1").trim();
//         typingEffect(responseText, textElement, botMsgDiv);
//         chatHistory.push({ role: "model", parts: [{ text: responseText }] });

//     } catch (error) {
//         console.error('API Error:', error);
//         textElement.textContent = "Oops! Something went wrong. Please try again. " + (error.message || "");
//         botMsgDiv.classList.remove("loading");
//     }
// };

// // Enhanced File Upload Handler
// const handleFileUpload = () => {
//     const fileInput = document.createElement('input');
//     fileInput.type = 'file';
//     fileInput.accept = 'image/*,.pdf,.txt,.doc,.docx';
//     fileInput.style.display = 'none';
    
//     fileInput.onchange = async (e) => {
//         const file = e.target.files[0];
//         if (!file) return;
        
//         // Check file size (limit to 10MB)
//         const maxSize = 10 * 1024 * 1024; // 10MB
//         if (file.size > maxSize) {
//             alert('File size too large. Please select a file smaller than 10MB.');
//             return;
//         }
        
//         // Show loading state
//         const loadingHTML = `
//             <div class="file-attachment">
//                 <span class="material-symbols-outlined">hourglass_empty</span>
//                 <span class="file-name">Processing ${file.name}...</span>
//             </div>
//         `;
//         const loadingDiv = createMsgElement(loadingHTML, "user-msg", "file-msg", "loading");
//         ChatsContainer.appendChild(loadingDiv);
//         scrollToBottom();
        
//         try {
//             // Convert file to base64
//             const base64Data = await fileToBase64(file);
            
//             // Store file data
//             uploadedFile = {
//                 file: file,
//                 base64Data: base64Data,
//                 name: file.name,
//                 type: file.type,
//                 size: file.size
//             };
            
//             // Update loading message to success
//             const fileUploadHTML = `
//                 <div class="file-attachment">
//                     <span class="material-symbols-outlined">attach_file</span>
//                     <span class="file-name">${file.name}</span>
//                     <span class="file-size">(${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
//                     <span class="file-status">✅ Uploaded</span>
//                 </div>
//             `;
//             loadingDiv.innerHTML = fileUploadHTML;
//             loadingDiv.classList.remove("loading");
            
//             // Set flag and prompt user to ask a question
//             isWaitingForFileQuestion = true;
            
//             setTimeout(() => {
//                 let botResponseText = "";
                
//                 if (isImageFile(file)) {
//                     botResponseText = `
//                         📸 Great! I can see your medical image has been uploaded successfully.
                        
//                         Now, please ask me a specific question about this image, such as:
//                         • "What do you see in this image?"
//                         • "Can you explain what might be causing this condition?"
//                         • "Are there any concerning signs I should be aware of?"
//                         • "What steps should I take next?"
                        
//                         💡 Tip: Be specific about what you'd like to know about the image for better assistance.
                        
//                         ⚠️ Remember: This is for informational purposes only. Always consult with a healthcare professional for proper medical diagnosis.
//                     `;
//                 } else if (isPdfFile(file)) {
//                     botResponseText = `
//                         📄 Perfect! Your medical document/report has been uploaded successfully.
                        
//                         Please ask me a question about this document, such as:
//                         • "Can you explain this report in simple terms?"
//                         • "What do these test results mean?"
//                         • "Are there any concerning values I should know about?"
//                         • "What should I discuss with my doctor about these results?"
                        
//                         💡 Tip: Be specific about which part of the document you'd like me to focus on.
                        
//                         ⚠️ Remember: This analysis is for educational purposes only. Always discuss your medical reports with your healthcare provider.
//                     `;
//                 } else {
//                     botResponseText = `
//                         📋 Your document has been uploaded successfully.
                        
//                         Please ask me a specific question about this document content, and I'll do my best to help you understand it from a medical perspective.
                        
//                         ⚠️ Remember: Always consult with healthcare professionals for medical advice.
//                     `;
//                 }
                
//                 const botMsgHTML = `<img src="30.png" alt="AI" class="avatar"><p class="message-text">${botResponseText}</p>`;
//                 const botMsgDiv = createMsgElement(botMsgHTML, "bot-message");
//                 ChatsContainer.appendChild(botMsgDiv);
//                 scrollToBottom();
//             }, 1000);
            
//         } catch (error) {
//             console.error('File processing error:', error);
//             loadingDiv.innerHTML = `
//                 <div class="file-attachment error">
//                     <span class="material-symbols-outlined">error</span>
//                     <span class="file-name">Error processing ${file.name}</span>
//                 </div>
//             `;
//             alert('Error processing file. Please try again.');
//         }
//     };
    
//     document.body.appendChild(fileInput);
//     fileInput.click();
//     document.body.removeChild(fileInput);
// };

// Enhanced Response Generation with proper file handling
// const generateResponse = async (botMsgDiv) => {
//     const textElement = botMsgDiv.querySelector(".message-text");
//     let requestBody = { contents: [] };

//     try {
//         let promptText;
//         let contentArray = [];

//         // Determine the base prompt
//         if (!hasInitialInfo) {
//             promptText = `You are a specialized Medical AI Assistant 🤖🩺 designed to support users with health-related concerns. Your role is to assist with medical queries ONLY. Follow these rules strictly: 2. Initial Information Gathering - Always begin by politely asking for the user's AGE, GENDER, and their MAIN PROBLEM or SYMPTOMS. - Example: To guide you better, may I know your age, gender, and the issue you are facing? 3. Response Style - Use simple, easy-to-understand language suitable for parents and elderly users. - Be empathetic, respectful, and clear. - Organize answers with emojis and sections like ❤ Possible Causes, 🛡 Precautions or Home Care, 🥗 Diet and Lifestyle Tips, 🩺 When to See a Doctor. If the issue seems urgent such as chest pain ❤️‍🔥, severe bleeding 🩸, or breathing difficulty 😮‍💨 then immediately advise urgent medical help 🚨 - Do not answer unrelated queries (e.g., finance, coding, etc.). User message:`;
//         } else {
//             promptText = `You are a specialized Medical AI Assistant designed to support users with health-related concerns. Your role is to assist with medical queries ONLY. Response Style -  Use simple, easy-to-understand language suitable for parents and elderly users. - Be empathetic, respectful, and clear. - Organize answers with emojis and sections like ❤ Possible Causes, 🛡 Precautions or Home Care, 🥗 Diet and Lifestyle Tips, 🩺 When to See a Doctor. If the issue seems urgent such as chest pain ❤️‍🔥, severe bleeding 🩸, or breathing difficulty 😮‍💨 then immediately advise urgent medical help 🚨 - Do not answer unrelated queries (e.g., finance, coding, etc.). The user's age is ${userAge} and their gender is ${userGender}.`;
//         }

//         // Handle file analysis if uploaded file exists and user has asked a question
//         if (uploadedFile && userMessage.trim()) {
//             if (isImageFile(uploadedFile.file)) {
//                 // For images, send both the image and the question
//                 contentArray.push({
//                     inlineData: {
//                         mimeType: uploadedFile.file.type,
//                         data: uploadedFile.base64Data
//                     }
//                 });
//                 contentArray.push({ 
//                     text: `${promptText} 

// IMPORTANT: The user has uploaded a medical image and asked: "${userMessage}"

// Please analyze this medical image and provide:
// 1. What you can observe in the image
// 2. Possible medical interpretations (if any)
// 3. Recommendations for next steps
// 4. Important disclaimer about seeking professional medical advice

// Remember to be clear that this is not a medical diagnosis and professional consultation is required.` 
//                 });
//             } else if (isPdfFile(uploadedFile.file)) {
//                 // For PDFs, send the document and the question
//                 contentArray.push({
//                     inlineData: {
//                         mimeType: uploadedFile.file.type,
//                         data: uploadedFile.base64Data
//                     }
//                 });
//                 contentArray.push({ 
//                     text: `${promptText} 

// IMPORTANT: The user has uploaded a medical document/report and asked: "${userMessage}"

// Please analyze this medical document and provide:
// 1. Summary of key information in simple terms
// 2. Explanation of any medical terminology
// 3. Important values or findings to note
// 4. Recommendations for discussion with healthcare provider

// Remember to explain complex medical terms in simple language that patients can understand.` 
//                 });
//             } else {
//                 // For other file types, just use text
//                 contentArray.push({ 
//                     text: `${promptText} User question: "${userMessage}"` 
//                 });
//             }
            
//             // Clear uploaded file after processing
//             uploadedFile = null;
//             isWaitingForFileQuestion = false;
//         } else {
//             // Regular text conversation
//             contentArray.push({ 
//                 text: `${promptText} User message: "${userMessage}"` 
//             });
//         }

//         // Add to chat history
//         chatHistory.push({
//             role: "user",
//             parts: contentArray
//         });

//         requestBody.contents = chatHistory;

//         const response = await fetch(API_URL, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(requestBody)
//         });

//         const data = await response.json();
//         if (!response.ok) {
//             console.error('API Error Details:', data);
//             throw new Error(data.error?.message || 'API request failed');
//         }

//         console.log('API Response:', data);
        
//         const responseText = data.candidates[0].content.parts[0].text.replace(/\*\*([^*]+)\*\*/g, "$1").trim();
//         typingEffect(responseText, textElement, botMsgDiv);
        
//         // Add bot response to history
//         chatHistory.push({ 
//             role: "model", 
//             parts: [{ text: responseText }] 
//         });

//     } catch (error) {
//         console.error('API Error:', error);
//         textElement.textContent = "I apologize, but I encountered an error processing your request. Please try again.";
//         if (error.message.includes('API key')) {
//             textElement.textContent += " Please check if your API key is valid.";
//         }
//         botMsgDiv.classList.remove("loading");
//     }
// };

// Enhanced File Upload Handler with better error handling

// Enhanced Medical Chat System with Optimized Prompt Management and Persistence

// Global state management
let isSystemInitialized = false;
let userProfile = {
    age: null,
    gender: null,
    medicalHistory: [],
    currentSymptoms: [],
    medications: [],
    allergies: [],
    lastVisit: null
};

// Storage keys
const STORAGE_KEYS = {
    USER_PROFILE: 'medical_ai_user_profile',
    CHAT_HISTORY: 'medical_ai_chat_history',
    CONVERSATION_ID: 'medical_ai_conversation_id',
    SYSTEM_INITIALIZED: 'medical_ai_system_initialized'
};

// Initialize system on page load
const initializeMedicalSystem = () => {
    loadUserProfile();
    loadChatHistory();
    isSystemInitialized = localStorage.getItem(STORAGE_KEYS.SYSTEM_INITIALIZED) === 'true';
    
    // Generate unique conversation ID if new session
    if (!localStorage.getItem(STORAGE_KEYS.CONVERSATION_ID)) {
        localStorage.setItem(STORAGE_KEYS.CONVERSATION_ID, generateConversationId());
    }
};

// Generate unique conversation ID
const generateConversationId = () => {
    return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Load user profile from storage
const loadUserProfile = () => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (stored) {
        userProfile = { ...userProfile, ...JSON.parse(stored) };
        hasInitialInfo = userProfile.age && userProfile.gender;
        userAge = userProfile.age;
        userGender = userProfile.gender;
    }
};

// Save user profile to storage
const saveUserProfile = () => {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
};

// Load chat history from storage
const loadChatHistory = () => {
    const stored = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    if (stored) {
        const savedHistory = JSON.parse(stored);
        chatHistory.length = 0;
        chatHistory.push(...savedHistory);
        
        // Restore chat UI
        restoreChatUI(savedHistory);
    }
};

// Save chat history to storage
const saveChatHistory = () => {
    localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(chatHistory));
};

// Restore chat UI from saved history
const restoreChatUI = (history) => {
    if (history.length === 0) return;
    
    // Hide suggestions and header if there's existing chat
    const appHeader = document.querySelector('.app-header');
    const suggestions = document.querySelector('.suggestions');
    if (appHeader) appHeader.style.display = 'none';
    if (suggestions) suggestions.style.display = 'none';
    
    // Restore messages (skip system prompts)
    history.forEach((entry, index) => {
        if (entry.role === 'user' && entry.displayMessage) {
            const userMsgHTML = `<p class="message-text">${entry.displayMessage}</p>`;
            const userMsgDiv = createMsgElement(userMsgHTML, "user-msg");
            ChatsContainer.appendChild(userMsgDiv);
        } else if (entry.role === 'model') {
            const botMsgHTML = `<img src="https://via.placeholder.com/32x32/6a11e6/white?text=AI" alt="AI" class="avatar"><p class="message-text">${entry.parts[0].text}</p>`;
            const botMsgDiv = createMsgElement(botMsgHTML, "bot-message");
            ChatsContainer.appendChild(botMsgDiv);
        }
    });
    
    scrollToBottom();
};

// Get system prompt (only sent once or when context changes)
const getSystemPrompt = () => {
    const conversationId = localStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);
    
    return `You are a specialized Medical AI Assistant designed to support users with health-related concerns. Your role is to assist with medical queries ONLY.

CONVERSATION CONTEXT:
- Conversation ID: ${conversationId}
- User Profile: Age ${userProfile.age || 'unknown'}, Gender ${userProfile.gender || 'unknown'}
- Medical History: ${userProfile.medicalHistory.length > 0 ? userProfile.medicalHistory.join(', ') : 'none provided'}
- Current Medications: ${userProfile.medications.length > 0 ? userProfile.medications.join(', ') : 'none provided'}
- Known Allergies: ${userProfile.allergies.length > 0 ? userProfile.allergies.join(', ') : 'none provided'}

INSTRUCTIONS:
1. Remember this user's information throughout our conversation
2. Reference their medical history when relevant
3. Use simple, easy-to-understand language
4. Organize answers with sections: Possible Causes, Precautions, When to See Doctor
5. For urgent symptoms (chest pain, severe bleeding, breathing difficulty), immediately advise medical help
6. Do not answer unrelated queries (finance, coding, etc.)
7. Always remind users this is for information only, not medical diagnosis

If this is our first interaction, collect: age, gender, main symptoms/concerns.
If continuing previous conversation, reference prior context appropriately.`;
};

// Extract and update user information from message
const extractUserInfo = (message) => {
    let updated = false;
    
    // Extract age
    const ageMatch = message.match(/(?:age is|i am|i'm)\s*(\d+)|(\d+)\s*years?\s*old/i);
    if (ageMatch && !userProfile.age) {
        userProfile.age = ageMatch[1] || ageMatch[2];
        userAge = userProfile.age;
        updated = true;
    }
    
    // Extract gender
    const genderMatch = message.match(/(?:gender is|i am|i'm)\s*(male|female|man|woman)/i);
    if (genderMatch && !userProfile.gender) {
        userProfile.gender = genderMatch[1].toLowerCase();
        if (userProfile.gender === 'man') userProfile.gender = 'male';
        if (userProfile.gender === 'woman') userProfile.gender = 'female';
        userGender = userProfile.gender;
        updated = true;
    }
    
    // Extract medical conditions
    const conditionKeywords = /(?:have|suffer from|diagnosed with|history of)\s+([^.!?]+)/gi;
    let match;
    while ((match = conditionKeywords.exec(message)) !== null) {
        const condition = match[1].trim();
        if (condition.length > 3 && !userProfile.medicalHistory.includes(condition)) {
            userProfile.medicalHistory.push(condition);
            updated = true;
        }
    }
    
    // Extract medications
    const medicationKeywords = /(?:taking|on|prescribed)\s+([^.!?]+?)(?:\s+(?:medication|medicine|drug|pill|tablet))/gi;
    while ((match = medicationKeywords.exec(message)) !== null) {
        const medication = match[1].trim();
        if (medication.length > 2 && !userProfile.medications.includes(medication)) {
            userProfile.medications.push(medication);
            updated = true;
        }
    }
    
    // Extract allergies
    const allergyKeywords = /(?:allergic to|allergy to)\s+([^.!?]+)/gi;
    while ((match = allergyKeywords.exec(message)) !== null) {
        const allergy = match[1].trim();
        if (allergy.length > 2 && !userProfile.allergies.includes(allergy)) {
            userProfile.allergies.push(allergy);
            updated = true;
        }
    }
    
    if (updated) {
        if (userProfile.age && userProfile.gender) {
            hasInitialInfo = true;
        }
        saveUserProfile();
    }
    
    return updated;
};

// Enhanced Response Generation with optimized prompt management
// REPLACE your generateResponse function with this:
const generateResponse = async (botMsgDiv) => {
    const textElement = botMsgDiv.querySelector(".message-text");

    try {
        // Extract user information from message
        extractUserInfo(userMessage);
        
        // Prepare content for current request
        let currentContent = [];
        
        // Handle file upload if present
        if (uploadedFile && userMessage.trim()) {
            if (isImageFile(uploadedFile.file)) {
                currentContent.push({
                    inlineData: {
                        mimeType: uploadedFile.file.type,
                        data: uploadedFile.base64Data
                    }
                });
                currentContent.push({ 
                    text: `The user asks: "${userMessage}". Please analyze this medical image.` 
                });
            } else if (isPdfFile(uploadedFile.file)) {
                currentContent.push({
                    inlineData: {
                        mimeType: uploadedFile.file.type,
                        data: uploadedFile.base64Data
                    }
                });
                currentContent.push({ 
                    text: `The user asks: "${userMessage}". Please analyze this medical document.` 
                });
            } else {
                currentContent.push({ text: userMessage });
            }
            
            uploadedFile = null;
            isWaitingForFileQuestion = false;
        } else {
            currentContent.push({ text: userMessage });
        }

        // Build clean API chat history
        let apiHistory = [];
        
        // Add system prompt only once
        if (!isSystemInitialized) {
            apiHistory.push({
                role: "user",
                parts: [{ text: getSystemPrompt() }]
            });
            isSystemInitialized = true;
            localStorage.setItem(STORAGE_KEYS.SYSTEM_INITIALIZED, 'true');
        }

        // Add previous conversations (clean API format only)
        chatHistory.forEach(entry => {
            if (entry.role && entry.parts) {
                const cleanParts = entry.parts.map(part => {
                    if (part.text) return { text: part.text };
                    if (part.inlineData) return { inlineData: part.inlineData };
                    return part;
                }).filter(part => part.text || part.inlineData);
                
                if (cleanParts.length > 0) {
                    apiHistory.push({
                        role: entry.role,
                        parts: cleanParts
                    });
                }
            }
        });

        // Add current message
        apiHistory.push({
            role: "user",
            parts: currentContent
        });

        // Make API request
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: apiHistory })
        });

        const data = await response.json();
        if (!response.ok) {
            console.error('API Error:', data);
            throw new Error(data.error?.message || 'API request failed');
        }

        const responseText = data.candidates[0].content.parts[0].text.replace(/\*\*([^*]+)\*\*/g, "$1").trim();
        
        // Save to local history with metadata
        chatHistory.push({
            role: "user",
            parts: currentContent,
            displayMessage: userMessage,
            timestamp: new Date().toISOString()
        });
        
        chatHistory.push({
            role: "model",
            parts: [{ text: responseText }],
            timestamp: new Date().toISOString()
        });
        
        saveChatHistory();
        typingEffect(responseText, textElement, botMsgDiv);

    } catch (error) {
        console.error('API Error:', error);
        textElement.textContent = "I apologize, but I encountered an issue. Please try again.";
        botMsgDiv.classList.remove("loading");
    }
};
// Enhanced clear chat with backup option
const clearChatHistory = () => {
    if (ChatsContainer.children.length === 0) {
        showNotification("No chat history to clear!", "info");
        return;
    }
    
    const shouldBackup = confirm("Do you want to backup your chat before clearing?\n\nOK = Backup and Clear\nCancel = Just Clear");
    
    if (shouldBackup) {
        // Create backup
        const backup = {
            timestamp: new Date().toISOString(),
            userProfile: userProfile,
            chatHistory: chatHistory,
            conversationId: localStorage.getItem(STORAGE_KEYS.CONVERSATION_ID)
        };
        
        const backupBlob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(backupBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `medical-chat-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    if (confirm("Are you sure you want to clear all chat history? This action cannot be undone.")) {
        // Clear everything
        ChatsContainer.innerHTML = "";
        chatHistory.length = 0;
        isSystemInitialized = false;
        
        // Reset user profile but keep basic info
        const basicInfo = { age: userProfile.age, gender: userProfile.gender };
        userProfile = { ...userProfile, medicalHistory: [], currentSymptoms: [], medications: [], allergies: [] };
        
        // Clear storage
        localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
        localStorage.removeItem(STORAGE_KEYS.SYSTEM_INITIALIZED);
        localStorage.setItem(STORAGE_KEYS.CONVERSATION_ID, generateConversationId());
        saveUserProfile();
        
        // Show header and suggestions
        const appHeader = document.querySelector('.app-header');
        const suggestions = document.querySelector('.suggestions');
        if (appHeader) appHeader.style.display = 'block';
        if (suggestions) suggestions.style.display = 'flex';
        
        showNotification("Chat cleared and backed up successfully!", "success");
    }
};

// Restore chat from backup
const restoreFromBackup = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const backup = JSON.parse(event.target.result);
                
                // Validate backup structure
                if (!backup.userProfile || !backup.chatHistory) {
                    throw new Error('Invalid backup file format');
                }
                
                if (confirm(`Restore chat from ${new Date(backup.timestamp).toLocaleString()}?\n\nThis will replace your current conversation.`)) {
                    // Restore data
                    userProfile = backup.userProfile;
                    chatHistory.length = 0;
                    chatHistory.push(...backup.chatHistory);
                    
                    // Update global state
                    hasInitialInfo = userProfile.age && userProfile.gender;
                    userAge = userProfile.age;
                    userGender = userProfile.gender;
                    isSystemInitialized = true;
                    
                    // Save to storage
                    saveUserProfile();
                    saveChatHistory();
                    localStorage.setItem(STORAGE_KEYS.SYSTEM_INITIALIZED, 'true');
                    if (backup.conversationId) {
                        localStorage.setItem(STORAGE_KEYS.CONVERSATION_ID, backup.conversationId);
                    }
                    
                    // Clear current UI and restore from backup
                    ChatsContainer.innerHTML = "";
                    restoreChatUI(backup.chatHistory);
                    
                    showNotification("Chat restored successfully!", "success");
                }
                
            } catch (error) {
                console.error('Restore error:', error);
                showNotification("Error restoring backup: " + error.message, "error");
            }
        };
        
        reader.readAsText(file);
    };
    
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
};

// Medical history management
const viewMedicalHistory = () => {
    if (userProfile.medicalHistory.length === 0 && userProfile.medications.length === 0 && userProfile.allergies.length === 0) {
        showNotification("No medical history recorded yet", "info");
        return;
    }
    
    let historyText = "Medical Profile Summary\n";
    historyText += "=======================\n\n";
    historyText += `Age: ${userProfile.age || 'Not specified'}\n`;
    historyText += `Gender: ${userProfile.gender || 'Not specified'}\n\n`;
    
    if (userProfile.medicalHistory.length > 0) {
        historyText += "Medical History:\n";
        userProfile.medicalHistory.forEach(condition => {
            historyText += `• ${condition}\n`;
        });
        historyText += "\n";
    }
    
    if (userProfile.medications.length > 0) {
        historyText += "Current Medications:\n";
        userProfile.medications.forEach(med => {
            historyText += `• ${med}\n`;
        });
        historyText += "\n";
    }
    
    if (userProfile.allergies.length > 0) {
        historyText += "Known Allergies:\n";
        userProfile.allergies.forEach(allergy => {
            historyText += `• ${allergy}\n`;
        });
    }
    
    // Copy to clipboard
    navigator.clipboard.writeText(historyText).then(() => {
        showNotification("Medical history copied to clipboard!", "success");
    }).catch(() => {
        alert(historyText);
    });
};

// Initialize system when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeMedicalSystem();
    
    // Add restore button functionality (add this button to your HTML)
    const restoreBtn = document.querySelector('#restore-chat-btn');
    if (restoreBtn) {
        restoreBtn.addEventListener('click', restoreFromBackup);
    }
    
    // Add medical history viewer (add this button to your HTML)
    const historyBtn = document.querySelector('#view-history-btn');
    if (historyBtn) {
        historyBtn.addEventListener('click', viewMedicalHistory);
    }
    
    // Override the original clear function
    const deleteChatBtn = document.querySelector('#delete-chats-btn');
    if (deleteChatBtn) {
        deleteChatBtn.removeEventListener('click', clearChatHistory);
        deleteChatBtn.addEventListener('click', clearChatHistory);
    }
});

const handleFileUpload = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,.pdf,.txt,.doc,.docx';
    fileInput.style.display = 'none';
    
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file size (10MB limit for Gemini API)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            showNotification('File size too large. Please select a file smaller than 10MB.', 'error');
            return;
        }

        // Validate file type
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (!allowedTypes.includes(file.type)) {
            showNotification('Unsupported file type. Please select an image, PDF, or document file.', 'error');
            return;
        }
        
        // Show loading state
        const loadingHTML = `
            <div class="file-attachment">
                <span class="material-icons">hourglass_empty</span>
                <span class="file-name">Processing ${file.name}...</span>
            </div>
        `;
        const loadingDiv = createMsgElement(loadingHTML, "user-msg", "file-msg", "loading");
        ChatsContainer.appendChild(loadingDiv);
        scrollToBottom();
        
        try {
            // Convert file to base64
            const base64Data = await fileToBase64(file);
            
            // Store file data globally
            uploadedFile = {
                file: file,
                base64Data: base64Data,
                name: file.name,
                type: file.type,
                size: file.size
            };
            
            // Update loading message to success
            const fileUploadHTML = `
                <div class="file-attachment">
                    <span class="material-icons">attach_file</span>
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">(${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    <span class="file-status">Ready for analysis</span>
                </div>
            `;
            loadingDiv.innerHTML = fileUploadHTML;
            loadingDiv.classList.remove("loading");
            
            // Set flag that we're waiting for a question about the file
            isWaitingForFileQuestion = true;
            
            // Prompt user with specific suggestions based on file type
            setTimeout(() => {
                let botResponseText = "";
                
                if (isImageFile(file)) {
                    botResponseText = `Your medical image "${file.name}" has been uploaded successfully and is ready for analysis.

Please ask me a specific question about this image, such as:
• "What do you see in this image?"
• "Can you describe any visible symptoms or conditions?"
• "What might be causing this appearance?"
• "Should I be concerned about what's shown?"

Type your question below and I'll analyze the image for you.

Important: This analysis is for informational purposes only and cannot replace professional medical diagnosis.`;
                } else if (isPdfFile(file)) {
                    botResponseText = `Your medical document "${file.name}" has been uploaded successfully and is ready for analysis.

Please ask me a specific question about this document, such as:
• "Can you explain this report in simple terms?"
• "What do these test results mean?"
• "Are there any concerning values in these results?"
• "What should I discuss with my doctor about this report?"

Type your question below and I'll analyze the document for you.

Important: This analysis is for educational purposes only. Always discuss medical reports with your healthcare provider.`;
                } else {
                    botResponseText = `Your document "${file.name}" has been uploaded successfully.

Please ask me a specific question about this document, and I'll help you understand it from a medical perspective.

Important: Always consult healthcare professionals for medical advice.`;
                }
                
                const botMsgHTML = `<div class="avatar"><span class="material-icons">smart_toy</span></div><p class="message-text">${botResponseText}</p>`;
                const botMsgDiv = createMsgElement(botMsgHTML, "bot-message");
                ChatsContainer.appendChild(botMsgDiv);
                scrollToBottom();
            }, 1000);
            
        } catch (error) {
            console.error('File processing error:', error);
            loadingDiv.innerHTML = `
                <div class="file-attachment error">
                    <span class="material-icons">error</span>
                    <span class="file-name">Error processing ${file.name}</span>
                </div>
            `;
            showNotification('Error processing file. Please try again.', 'error');
        }
    };
    
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
};

// Update the form submission handler to work better with file uploads
const handleformsubmit = (e) => {
    e.preventDefault();
    userMessage = promptInput.value.trim();
    if (!userMessage) return;

    promptInput.value = "";

    // Generate user message HTML and add it to the Chats container
    const userMsgHTML = `<p class="message-text"></p>`;
    const userMsgDiv = createMsgElement(userMsgHTML, "user-msg");
    userMsgDiv.querySelector(".message-text").textContent = userMessage;
    ChatsContainer.appendChild(userMsgDiv);
    scrollToBottom();

    // Extract user info from message if not already collected
    if (!hasInitialInfo) {
        const ageMatch = userMessage.match(/age is (\d+)|(\d+)\s*years old|i am (\d+)|age (\d+)/i);
        const genderMatch = userMessage.match(/gender is (male|female)|(male|female)|i am (male|female)|(male|female) gender/i);

        if (ageMatch) {
            userAge = ageMatch[1] || ageMatch[2] || ageMatch[3] || ageMatch[4];
        }
        if (genderMatch) {
            userGender = (genderMatch[1] || genderMatch[2] || genderMatch[3] || genderMatch[4]).toLowerCase();
        }

        if (userAge && userGender) {
            hasInitialInfo = true;
        }
    }

    setTimeout(() => {
        const botMsgHTML = `<div class="avatar"><span class="material-icons">smart_toy</span></div><p class="message-text">Analyzing your request...</p>`;
        const botMsgDiv = createMsgElement(botMsgHTML, "bot-message", "loading");
        ChatsContainer.appendChild(botMsgDiv);
        scrollToBottom();
        generateResponse(botMsgDiv);
    }, 600);
};

// const clearChatHistory = () => {
//     if (confirm("Are you sure you want to clear all chat history? This action cannot be undone.")) {
//         ChatsContainer.innerHTML = "";
//         chatHistory.length = 0;
//         userAge = null;
//         userGender = null;
//         hasInitialInfo = false;
//         uploadedFile = null;
//         isWaitingForFileQuestion = false;
        
//         const appHeader = document.querySelector('.app-header');
//         const suggestions = document.querySelector('.suggestions');
        
//         if (appHeader) appHeader.style.display = 'block';
//         if (suggestions) suggestions.style.display = 'flex';
        
//         showNotification("Chat history cleared successfully!", "success");
//     }
// };

// Export Chat Functionality
const exportChatHistory = () => {
    if (ChatsContainer.children.length === 0) {
        alert("No chat history to export!");
        return;
    }
    
    const chatData = {
        exportDate: new Date().toLocaleString(),
        userInfo: {
            age: userAge || "Not provided",
            gender: userGender || "Not provided"
        },
        conversations: []
    };
    
    const messages = ChatsContainer.querySelectorAll('.msg');
    messages.forEach(msg => {
        const isUser = msg.classList.contains('user-msg');
        const isFile = msg.classList.contains('file-msg');
        const messageText = msg.querySelector('.message-text');
        const fileAttachment = msg.querySelector('.file-attachment');
        
        if (isFile && fileAttachment) {
            const fileName = fileAttachment.querySelector('.file-name')?.textContent || 'Unknown file';
            chatData.conversations.push({
                type: 'file',
                content: `[File uploaded: ${fileName}]`,
                timestamp: new Date().toLocaleString()
            });
        } else if (messageText) {
            chatData.conversations.push({
                type: isUser ? 'user' : 'bot',
                content: messageText.textContent.trim(),
                timestamp: new Date().toLocaleString()
            });
        }
    });
    
    const exportAsJson = confirm(
        "Choose export format:\n\n" +
        "OK = Download as JSON file\n" +
        "Cancel = Copy to clipboard as text"
    );
    
    if (exportAsJson) {
        const jsonData = JSON.stringify(chatData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `medical-chat-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification("Chat exported successfully!", "success");
    } else {
        let textData = `Medical AI Chat Export\n`;
        textData += `Export Date: ${chatData.exportDate}\n`;
        textData += `User Age: ${chatData.userInfo.age}\n`;
        textData += `User Gender: ${chatData.userInfo.gender}\n`;
        textData += `\n${"=".repeat(50)}\n\n`;
        
        chatData.conversations.forEach((conv) => {
            const speaker = conv.type === 'user' ? 'You' : conv.type === 'bot' ? 'Medical AI' : 'File';
            textData += `${speaker}: ${conv.content}\n\n`;
        });
        
        textData += `\n${"=".repeat(50)}\n`;
        textData += `⚠️ DISCLAIMER: This conversation is for informational purposes only and is not a substitute for professional medical advice.\n`;
        
        navigator.clipboard.writeText(textData).then(() => {
            showNotification("Chat history copied to clipboard!", "success");
        }).catch(() => {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = textData;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showNotification("Chat history copied to clipboard!", "success");
        });
    }
};

// Notification System
const showNotification = (message, type = 'info') => {
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        info: '#2196F3',
        warning: '#ff9800'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 1000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme
    initializeTheme();
    
    // Theme toggle button
    const themeToggleBtn = document.querySelector('#theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    // Clear chat button
    const deleteChatBtn = document.querySelector('#delete-chats-btn');
    if (deleteChatBtn) {
        deleteChatBtn.addEventListener('click', clearChatHistory);
    }
    
    // File upload button
    const addFileBtn = document.querySelector('#add-file-btn');
    if (addFileBtn) {
        addFileBtn.addEventListener('click', handleFileUpload);
    }
    
    // Export chat button
    const exportChatBtn = document.querySelector('#export-chat-btn');
    if (exportChatBtn) {
        exportChatBtn.addEventListener('click', exportChatHistory);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            exportChatHistory();
        }
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            clearChatHistory();
        }
        if (e.ctrlKey && e.key === 't') {
            e.preventDefault();
            toggleTheme();
        }
    });
    
    // Handle suggestion clicks
    const suggestionItems = document.querySelectorAll('.suggestions-items');
    suggestionItems.forEach(item => {
        item.addEventListener('click', () => {
            const text = item.querySelector('.text').textContent;
            promptInput.value = text;
            promptInput.focus();
            setTimeout(() => {
                promptform.dispatchEvent(new Event('submit'));
            }, 100);
        });
    });
    
    // Hide header and suggestions when first message is sent
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && ChatsContainer.children.length > 0) {
                const appHeader = document.querySelector('.app-header');
                const suggestions = document.querySelector('.suggestions');
                
                if (appHeader) appHeader.style.display = 'none';
                if (suggestions) suggestions.style.display = 'none';
            }
        });
    });
    
    observer.observe(ChatsContainer, { childList: true });
});

// Form submit event listener
promptform.addEventListener("submit", handleformsubmit);