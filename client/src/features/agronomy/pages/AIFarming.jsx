import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiSend, FiCpu, FiAlertCircle, FiImage, FiActivity, FiArrowRight } from 'react-icons/fi';
import Button from '../../../components/common/Button.jsx';
import Input from '../../../components/common/Input.jsx';
import Loader from '../../../components/common/Loader.jsx';
import * as agronomyApi from '../../../api/agronomy.api.js';

const AIFarming = () => {
  const [activeSubTab, setActiveSubTab] = useState('chat'); // chat, disease
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: 'Hello! I am your AI Farming Expert. Ask me anything about crop cycles, fertilizer choices, pest control, or land management. How can I help you today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Disease Detection State
  const [selectedSample, setSelectedSample] = useState(null);
  const [diseaseResult, setDiseaseResult] = useState(null);
  const [detectLoading, setDetectLoading] = useState(false);

  const sampleLeaves = [
    { name: 'spot_leaf.jpg', label: 'Leaf with spots', desc: 'Simulate Cercospora Leaf Spot' },
    { name: 'wilt_leaf.jpg', label: 'Wilting/dying leaf', desc: 'Simulate Fusarium Wilt' },
    { name: 'rust_leaf.jpg', label: 'Yellow/orange powdery leaf', desc: 'Simulate Leaf Rust' },
    { name: 'healthy_leaf.jpg', label: 'Bright green leaf', desc: 'Simulate Healthy Leaf' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, chatLoading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = {
      role: 'user',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setChatLoading(true);

    try {
      const res = await agronomyApi.chatAI({ prompt: userMsg.text });
      const aiReply = {
        role: 'ai',
        text: res.data.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      toast.error('AI Assistant is currently offline.');
    } finally {
      setChatLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setInputText(question);
  };

  const handleDetectDisease = async (fileName) => {
    setSelectedSample(fileName);
    setDetectLoading(true);
    setDiseaseResult(null);

    try {
      const res = await agronomyApi.detectDisease({ fileName });
      setDiseaseResult(res.data);
      toast.success('Leaf analysis completed!');
    } catch (err) {
      toast.error('Disease detection failed.');
    } finally {
      setDetectLoading(false);
    }
  };

  return (
    <div className="ai-farming-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FiCpu className="text-green-400" /> AI Farm Expert
          </h1>
          <p className="page-subtitle">Get advice from our agronomist chatbot and run visual leaf disease diagnosis</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-header glass-card mb-6">
        <div className="tabs">
          <button
            className={`tab-btn ${activeSubTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('chat')}
          >
            Farming Chat Assistant
          </button>
          <button
            className={`tab-btn ${activeSubTab === 'disease' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('disease')}
          >
            Leaf Disease Diagnosis
          </button>
        </div>
      </div>

      {activeSubTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Quick Questions Sidebar */}
          <div className="lg:col-span-1 glass-card p-4 rounded-lg flex flex-col gap-3 h-fit">
            <h3 className="text-md font-bold mb-2 text-gray-200">Quick Recommendations</h3>
            <button
              onClick={() => handleQuickQuestion('How to grow high yield Sugarcane?')}
              className="text-left text-sm p-3 rounded bg-zinc-800/60 hover:bg-zinc-800 text-gray-300 hover:text-white transition-colors border border-zinc-700/50"
            >
              How to grow high yield Sugarcane?
            </button>
            <button
              onClick={() => handleQuickQuestion('What fertilizer strategy is best for Wheat?')}
              className="text-left text-sm p-3 rounded bg-zinc-800/60 hover:bg-zinc-800 text-gray-300 hover:text-white transition-colors border border-zinc-700/50"
            >
              Fertilizer strategy for Wheat?
            </button>
            <button
              onClick={() => handleQuickQuestion('Tips on organic pest control for Rice paddy')}
              className="text-left text-sm p-3 rounded bg-zinc-800/60 hover:bg-zinc-800 text-gray-300 hover:text-white transition-colors border border-zinc-700/50"
            >
              Organic pest control for Rice?
            </button>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3 glass-card p-0 rounded-lg flex flex-col h-[500px]">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center gap-3 bg-zinc-900/40">
              <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center text-green-400">
                <FiCpu />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-200">AgroBot Agronomy Advisor</p>
                <p className="text-xs text-green-400 flex items-center gap-1">● Online | Ready to assist</p>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-green-700 text-white rounded-br-none'
                        : 'bg-zinc-800 text-gray-200 rounded-bl-none border border-zinc-700/50'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <p className="text-[10px] text-zinc-400 text-right mt-1">{msg.time}</p>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 text-gray-400 rounded-lg rounded-bl-none p-3 border border-zinc-700/50 flex items-center gap-2 text-sm">
                    <Loader className="h-4 w-4" /> AgroBot is typing...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800 flex gap-2 bg-zinc-900/20">
              <input
                type="text"
                className="input-field flex-1"
                placeholder="Ask your agronomy question..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                required
              />
              <Button type="submit" variant="primary" icon={FiSend} disabled={chatLoading} />
            </form>
          </div>
        </div>
      )}

      {activeSubTab === 'disease' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leaf Simulators */}
          <div className="lg:col-span-1 glass-card p-6 rounded-lg flex flex-col gap-4">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-1.5">
              <FiImage className="text-green-400" /> Diagnose Disease
            </h3>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
              Select one of the sample leaf images below to simulate leaf upload and run AI disease diagnostic algorithms.
            </p>

            <div className="space-y-3">
              {sampleLeaves.map((leaf) => (
                <div
                  key={leaf.name}
                  onClick={() => handleDetectDisease(leaf.name)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col ${
                    selectedSample === leaf.name
                      ? 'bg-green-500/10 border-green-500/60 scale-102 shadow-[0_0_12px_rgba(74,222,128,0.1)]'
                      : 'bg-zinc-800/40 border-zinc-700/50 hover:bg-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <span className="font-bold text-sm text-gray-200 flex items-center gap-2">
                    🍂 {leaf.label}
                  </span>
                  <span className="text-xs text-gray-400 mt-1 italic">{leaf.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Diagnostic Outputs */}
          <div className="lg:col-span-2 glass-card p-6 rounded-lg flex flex-col min-h-[400px]">
            {detectLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <Loader />
                <p className="text-gray-400 text-sm">Analyzing leaf patterns, moisture indicators, and spots...</p>
              </div>
            ) : diseaseResult ? (
              <div className="space-y-6 fade-in">
                <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                  <div>
                    <h3 className="text-xl font-extrabold flex items-center gap-2">
                      <FiActivity className={diseaseResult.isHealthy ? 'text-green-400' : 'text-red-400'} />
                      {diseaseResult.diseaseName}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Diagnosis Confidence: {diseaseResult.confidence}%</p>
                  </div>
                  <span
                    className={`badge badge-${
                      diseaseResult.isHealthy ? 'green' : 'coral'
                    } py-1.5 px-3 rounded text-sm font-bold`}
                  >
                    {diseaseResult.isHealthy ? 'Healthy Leaf' : 'Infected Leaf'}
                  </span>
                </div>

                {!diseaseResult.isHealthy && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm flex gap-3">
                    <FiAlertCircle className="text-2xl shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold">Organic treatments are required:</h4>
                      <p className="mt-1 leading-relaxed">
                        This infection can spread to neighboring crop lines. Drench soils or apply recommended sprays immediately.
                      </p>
                    </div>
                  </div>
                )}

                {/* Treatment Suggestions */}
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-200">Recommended Actions & Treatments</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-800/40 rounded-lg border border-zinc-700/50">
                      <h5 className="font-semibold text-sm text-green-400 mb-2">Treatments (Organic & Bio)</h5>
                      {diseaseResult.treatments.length === 0 ? (
                        <p className="text-xs text-gray-400">No active treatments needed.</p>
                      ) : (
                        <ul className="list-disc pl-4 space-y-1 text-sm text-gray-300">
                          {diseaseResult.treatments.map((tr, i) => (
                            <li key={i}>{tr}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="p-4 bg-zinc-800/40 rounded-lg border border-zinc-700/50">
                      <h5 className="font-semibold text-sm text-blue-400 mb-2">Preventive Measures</h5>
                      <ul className="list-disc pl-4 space-y-1 text-sm text-gray-300">
                        {diseaseResult.preventiveMeasures.map((pr, i) => (
                          <li key={i}>{pr}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-500">
                <span className="text-5xl mb-3">🔬</span>
                <h3 className="font-semibold">No Diagnosis Run</h3>
                <p className="text-sm mt-1">Select a sample leaf on the left panel to begin diagnostic analysis.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIFarming;
