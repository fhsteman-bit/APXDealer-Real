import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { collection, addDoc, updateDoc, doc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Send, Bot, User } from 'lucide-react';

// Initialize Gemini API
// Note: In this environment, GEMINI_API_KEY is automatically injected.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const addCarDeclaration: FunctionDeclaration = {
  name: 'addCar',
  description: 'Add a new car to the inventory.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      make: { type: Type.STRING, description: 'The make of the car (e.g., Porsche, Ferrari).' },
      model: { type: Type.STRING, description: 'The model of the car.' },
      year: { type: Type.NUMBER, description: 'The manufacturing year.' },
      price: { type: Type.NUMBER, description: 'The listing price in Euros.' },
      costPrice: { type: Type.NUMBER, description: 'The internal cost price in Euros.' },
      description: { type: Type.STRING, description: 'A short description of the car.' },
      imageUrl: { type: Type.STRING, description: 'A URL to an image of the car. If unknown, use a placeholder.' },
      status: { type: Type.STRING, description: 'Status of the car: "Available", "Reserved", or "Sold".' },
      condition: { type: Type.STRING, description: 'Condition: "New", "Used", "Imported", or "Showroom".' },
      vin: { type: Type.STRING, description: 'Vehicle Identification Number.' },
      engineType: { type: Type.STRING, description: 'Engine type (e.g., 4.0L V8).' },
      horsepower: { type: Type.STRING, description: 'Horsepower (e.g., 710 hp).' },
      performance: { type: Type.STRING, description: '0-100 km/h performance (e.g., 2.9s).' },
      location: { type: Type.STRING, description: 'Location: "Showroom", "Warehouse", or "In Transit".' }
    },
    required: ['make', 'model', 'year', 'price', 'description', 'status']
  }
};

const updateCarPriceDeclaration: FunctionDeclaration = {
  name: 'updateCarPrice',
  description: 'Update the price of an existing car in the inventory.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      carId: { type: Type.STRING, description: 'The unique ID of the car to update.' },
      newPrice: { type: Type.NUMBER, description: 'The new price in Euros.' }
    },
    required: ['carId', 'newPrice']
  }
};

const updateSettingDeclaration: FunctionDeclaration = {
  name: 'updateSetting',
  description: 'Update a website setting, such as text, laws, policies, or hero titles.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      settingKey: { 
        type: Type.STRING, 
        description: 'The key of the setting to update. Valid keys: heroTitle, heroSubtitle, aboutText, sourcingText, howWeWorkText, footerDescription, workingHours, contactEmail, contactPhone.' 
      },
      newValue: { type: Type.STRING, description: 'The new text or value for the setting.' }
    },
    required: ['settingKey', 'newValue']
  }
};

export default function AIAssistant({ cars, settings, onSettingsUpdated }: { cars: any[], settings: any, onSettingsUpdated: () => void }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([
    { role: 'assistant', text: 'Hello! I am your AI Admin Assistant. I can help you upload cars, change prices, and update website text (like laws, policies, or descriptions). What would you like to do?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // Build context for the AI
      const context = `
        You are an AI Admin Assistant for a luxury car dealership website.
        Current Inventory: ${JSON.stringify(cars.map(c => ({ id: c.id, make: c.make, model: c.model, price: c.countryPrices?.['Global'] })))}
        Current Settings: ${JSON.stringify(settings)}
        
        If the user asks to change a price, find the car ID from the inventory and use the updateCarPrice tool.
        If the user asks to add a car, use the addCar tool.
        If the user asks to change laws, policies, or text, use the updateSetting tool.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [context, ...messages.map(m => m.text), userMessage].join('\n\n'),
        config: {
          tools: [{ functionDeclarations: [addCarDeclaration, updateCarPriceDeclaration, updateSettingDeclaration] }]
        }
      });

      let assistantReply = response.text || '';

      // Handle function calls
      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const call of response.functionCalls) {
          if (call.name === 'addCar') {
            const args = call.args as any;
            await addDoc(collection(db, 'cars'), {
              make: args.make,
              model: args.model,
              year: args.year,
              countryPrices: { 'Global': args.price },
              costPrice: args.costPrice || null,
              description: args.description,
              images: args.imageUrl ? [args.imageUrl] : [],
              status: args.status,
              condition: args.condition || 'New',
              vin: args.vin || '',
              engineType: args.engineType || '',
              horsepower: args.horsepower || '',
              performance: args.performance || '',
              location: args.location || 'Showroom',
              createdAt: serverTimestamp()
            });
            assistantReply += `\n\nI have successfully added the ${args.year} ${args.make} ${args.model} to the inventory.`;
          } else if (call.name === 'updateCarPrice') {
            const args = call.args as any;
            await updateDoc(doc(db, 'cars', args.carId), {
              'countryPrices.Global': args.newPrice
            });
            assistantReply += `\n\nI have updated the price of the car to €${args.newPrice}.`;
          } else if (call.name === 'updateSetting') {
            const args = call.args as any;
            await updateDoc(doc(db, 'settings', 'general'), {
              [args.settingKey]: args.newValue
            });
            onSettingsUpdated();
            assistantReply += `\n\nI have updated the website setting "${args.settingKey}".`;
          }
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', text: assistantReply || 'Action completed.' }]);
    } catch (error: any) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', text: `Sorry, I encountered an error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-black border border-white/10">
      <div className="p-4 border-b border-white/10 bg-[#111]">
        <h3 className="text-sm font-medium tracking-[0.2em] uppercase text-white flex items-center gap-2">
          <Bot size={18} />
          AI Admin Assistant
        </h3>
        <p className="text-xs text-gray-400 mt-1">Powered by AI to manage your inventory and settings.</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-sm flex gap-3 ${msg.role === 'user' ? 'bg-white/10 text-white' : 'bg-[#111] border border-white/10 text-gray-300'}`}>
              {msg.role === 'assistant' ? <Bot size={16} className="mt-1 shrink-0" /> : <User size={16} className="mt-1 shrink-0" />}
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#111] border border-white/10 p-4 rounded-sm flex gap-3 items-center">
              <Bot size={16} className="text-gray-400" />
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/10 bg-[#111]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="e.g., Change the price of the Ferrari to 250000..."
            className="flex-1 bg-black border border-white/20 p-3 text-white text-sm focus:border-white outline-none transition-colors"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
