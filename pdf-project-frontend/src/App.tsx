import React, { useState, useRef, KeyboardEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download } from 'lucide-react';
import { handleFileUpload, handleSendMessage, handleDownloadPDF } from './handlers';

interface Message {
  role: 'user' | 'system';
  content: string;
}

function App() {
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [pdfFields, setPdfFields] = useState<{ name: string, value: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleKeyPress = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage(inputMessage, setInputMessage, setChatMessages, pdfFields, setPdfFields, chatMessages);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle> 💸 Tax AI 💸 </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pdf-upload">Upload PDF</Label>
              <Input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileUpload(e, setUploadedFile, setPdfUploaded, setChatMessages, setPdfFields, chatMessages, pdfFields)}
                ref={fileInputRef}
                className="mb-4"
              />
              {pdfUploaded && (
                <Card>
                  <CardHeader>
                    <CardTitle>PDF Fields</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pdfFields.map((field, index) => (
                      <div key={index} className="mb-2">
                        <Label htmlFor={field.name}>{field.name}</Label>
                        <Input
                          id={field.name}
                          value={field.value}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const updatedFields = [...pdfFields];
                            updatedFields[index].value = e.target.value;
                            setPdfFields(updatedFields);
                          }}
                        />
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter>
                    <Button onClick={() => handleDownloadPDF(uploadedFile, pdfFields)} className="w-full">
                      <Download className="mr-2 h-4 w-4" /> Download Updated PDF
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
            <div>
              <ScrollArea className="h-[400px] w-full border rounded-md p-4">
                {chatMessages.map((message, index) => (
                  <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <span className={`inline-block p-2 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
                      {message.content}
                    </span>
                  </div>
                ))}
              </ScrollArea>
              <div className="mt-4 flex">
                <Textarea
                  value={inputMessage}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-grow mr-2"
                />
                <Button onClick={() => handleSendMessage(inputMessage, setInputMessage, setChatMessages, pdfFields, setPdfFields, chatMessages)}>Send</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
