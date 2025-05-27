"use client";

import { useCallback, useEffect, useState } from "react";
import { VoiceAssistant, GeneralConnectionDetails, VoiceAssistantConfig } from "sycoraxai-voice-assistants";

const config: VoiceAssistantConfig = {
  onDeviceFailure: (error: Error) => {
    console.error(error);
    alert(
      "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
    );
  },
};

export default function Page() {
  const [connectionDetails, setConnectionDetails] = useState<GeneralConnectionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [microphonePermission, setMicrophonePermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [disconnectFunction, setDisconnectFunction] = useState<(() => void) | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const fetchConnectionDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const url = new URL(
        process.env.NEXT_PUBLIC_TOKEN_SERVER_URL ?? "http://localhost:8000/api/connection-details",
        window.location.origin
      );
      
      console.log("SERVER URL ", url);
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Failed to get connection details: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Add provider info if not present (defaulting to livekit for now)
      const connectionDetails: GeneralConnectionDetails = {
        provider: data.provider || 'livekit',
        payload: data
      };

      console.log("CONNECTION DETAILS ", connectionDetails);
      
      setConnectionDetails(connectionDetails);
    } catch (err) {
      console.error('Failed to fetch connection details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch connection details');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicrophonePermission('granted');
    } catch (err) {
      setMicrophonePermission('denied');
      console.error('Microphone permission denied:', err);
    }
  };

  const handleStartConversation = async () => {
    try {
      setIsStarting(true);
      // Fetch new connection details before starting conversation
      await fetchConnectionDetails();
      setIsConnected(true);
    } catch (err) {
      console.error('Failed to start conversation:', err);
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndConversation = () => {
    if (disconnectFunction) {
      disconnectFunction();
    }
    setIsConnected(false);
    setDisconnectFunction(null);
    // Reset connection details to null so new ones are fetched on next start
    setConnectionDetails(null);
  };

  const handleAssistantReady = (disconnect: () => void) => {
    setDisconnectFunction(() => disconnect);
  };

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Main Card */}
        <div className="bg-gray-800 rounded-3xl p-8 shadow-2xl border border-gray-700">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              The Trends 2025
            </h1>
          </div>

          {/* Content */}
          {!isConnected ? (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  Start Voice Conversation
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Click the button below to start talking with our AI voice agent
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-4">
                {/* Microphone Permission Button */}
                <button
                  onClick={requestMicrophonePermission}
                  disabled={microphonePermission === 'granted'}
                  className={`w-full py-4 px-6 rounded-2xl font-medium transition-all duration-200 ${
                    microphonePermission === 'granted'
                      ? 'bg-green-600 text-white cursor-default'
                      : microphonePermission === 'denied'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-600 text-white hover:bg-gray-500'
                  }`}
                >
                  {microphonePermission === 'granted' 
                    ? '✓ Microphone access granted'
                    : microphonePermission === 'denied'
                    ? 'Microphone access denied - Click to retry'
                    : 'Allow microphone access'
                  }
                </button>

                {/* Start Conversation Button */}
                <button
                  onClick={handleStartConversation}
                  disabled={isLoading || error !== null || microphonePermission !== 'granted' || isStarting}
                  className={`w-full py-4 px-6 rounded-2xl font-medium transition-all duration-200 flex items-center justify-center gap-3 ${
                    isLoading || error !== null || microphonePermission !== 'granted' || isStarting
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                  }`}
                >
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" 
                    />
                  </svg>
                  {isLoading ? 'Loading...' : isStarting ? 'Starting...' : 'Start Conversation'}
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-xl">
                  <div className="text-red-300 text-sm text-center">
                    Error: {error}
                  </div>
                  <button 
                    onClick={fetchConnectionDetails}
                    className="mt-2 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    Retry
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Voice Assistant Content */}
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">
                  Voice Conversation Active
                </h2>
                <p className="text-gray-400 text-sm">
                  You can now speak with the AI agent
                </p>
              </div>

              {/* Voice Assistant Component */}
              <div className="mb-6" data-lk-theme="default">
                {connectionDetails && (
                  <VoiceAssistant 
                    connectionDetails={connectionDetails} 
                    config={config}
                    onAssistantReady={handleAssistantReady}
                  />
                )}
              </div>

              {/* End Conversation Button */}
              <button
                onClick={handleEndConversation}
                className="w-full py-3 px-6 rounded-2xl font-medium bg-red-600 text-white hover:bg-red-700 active:bg-red-800 transition-all duration-200"
              >
                End Conversation
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Powered by aiwing.ru
          </p>
        </div>
      </div>
    </main>
  );
}
