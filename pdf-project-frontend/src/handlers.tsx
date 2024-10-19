import { SetStateAction, Dispatch } from 'react';

interface PdfField {
  name: string;
  value: string;
}

interface Message {
  role: 'user' | 'system';
  content: string;
}

export const handleFileUpload = async (
  event: React.ChangeEvent<HTMLInputElement>,
  setUploadedFile: Dispatch<SetStateAction<File | null>>,
  setPdfUploaded: Dispatch<SetStateAction<boolean>>,
  setChatMessages: Dispatch<SetStateAction<Message[]>>,
  setPdfFields: Dispatch<SetStateAction<PdfField[]>>,
  chatMessages: Message[],
  pdfFields: PdfField[]
) => {
  const file = event.target.files?.[0];
  if (file && file.type === 'application/pdf') {
    setUploadedFile(file);
    setPdfUploaded(true);
    const newChatMessages: Message[] = [...chatMessages, { role: 'system', content: "Great! I've received your PDF. Let's start filling out the fields." }]
    setChatMessages(newChatMessages);
    console.log(chatMessages);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('http://127.0.0.1:8000/upload_pdf', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload PDF');
      }

      const { filepath } = await uploadResponse.json();

      const fieldsResponse = await fetch(`http://127.0.0.1:8000/get_fields?input_pdf_path=${filepath}`);
      const fieldNames = await fieldsResponse.json();

      setPdfFields(fieldNames.map((name: string) => ({ name, value: '' })));
    } catch (error) {
      console.error('Error uploading PDF or fetching fields:', error);
      alert('An error occurred while processing the PDF. Please try again.');
      setPdfUploaded(false);
    }
  } else {
    alert('Please upload a valid PDF file.');
  }
};

export const handleSendMessage = async (
  inputMessage: string,
  setInputMessage: Dispatch<SetStateAction<string>>,
  setChatMessages: Dispatch<SetStateAction<Message[]>>,
  pdfFields: PdfField[],
  setPdfFields: Dispatch<SetStateAction<PdfField[]>>,
  prevMessages: Message[],
) => {
  if (inputMessage.trim() === '') return;

  const userMessage: Message = { role: 'user', content: inputMessage.trim() };
  
  try {
    const context = `I am a helpful assistant here to guide you in understanding and filling out your PDF. 
        Try to help in 200 words or less. Below is the chat history between us:\n` + 
                    prevMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n');

    const response = await fetch('http://127.0.0.1:8000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ context: context, query: inputMessage }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from chat service');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    // Add the user's message to the chat
    setChatMessages(prev => [...prev, userMessage]);

    let botResponse = '';
    setChatMessages(prev => [...prev, { role: 'system', content: '' }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = new TextDecoder().decode(value);
      botResponse += chunk;
      setChatMessages(prevMessages => {
        const newMessages = [...prevMessages];
        newMessages[newMessages.length - 1].content += chunk;
        return newMessages;
      });
    }

    // Update PDF fields based on the bot's response
    // This is a simplified example; you might need more complex logic here
    const updatedFields = [...pdfFields];
    const emptyFieldIndex = updatedFields.findIndex(field => field.value === '');
    if (emptyFieldIndex !== -1) {
      updatedFields[emptyFieldIndex].value = inputMessage;
      setPdfFields(updatedFields);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    // Add the user's message even if there was an error
    setChatMessages(prev => [
      ...prev,
      userMessage,
      { role: 'system', content: 'Sorry, there was an error processing your message.' }
    ]);
  } finally {
    setInputMessage('');
  }
};

export const handleDownloadPDF = async (
  uploadedFile: File | null,
  pdfFields: PdfField[]
) => {
  if (!uploadedFile) return;

  try {
    const formData = new FormData();
    formData.append('file', uploadedFile);
    
    const fieldData = Object.fromEntries(pdfFields.map(field => [field.name, field.value]));
    formData.append('field_data', JSON.stringify(fieldData));

    const response = await fetch('http://127.0.0.1:8000/fill_pdf', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to fill PDF');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'filled_document.pdf';
    link.click();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error filling PDF:', error);
    alert('An error occurred while filling the PDF. Please try again.');
  }
};
