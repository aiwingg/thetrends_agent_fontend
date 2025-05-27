"use client";

import { useCallback, useEffect, useState } from "react";
import { VoiceAssistant, ConnectionDetails, VoiceAssistantConfig } from "sycoraxai-voice-assistants";

const config: VoiceAssistantConfig = {
  onDeviceFailure: (error: Error) => {
    console.error(error);
    alert(
      "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
    );
  },
};

export default function Page() {
  const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const connectionDetails: ConnectionDetails = {
        serverUrl: data.serverUrl,
        participantToken: data.participantToken,
        provider: data.provider || 'livekit'
      };
      
      setConnectionDetails(connectionDetails);
    } catch (err) {
      console.error('Failed to fetch connection details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch connection details');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnectionDetails();
  }, [fetchConnectionDetails]);

  if (isLoading) {
    return (
      <main data-lk-theme="default" className="h-full grid content-center bg-[var(--lk-bg)]">
        <div className="flex items-center justify-center">
          <div>Loading...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main data-lk-theme="default" className="h-full grid content-center bg-[var(--lk-bg)]">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="text-red-500">Error: {error}</div>
          <button 
            onClick={fetchConnectionDetails}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main data-lk-theme="default" className="h-full grid content-center bg-[var(--lk-bg)]">
      <div className="lk-room-container max-w-[1024px] w-[90vw] mx-auto max-h-[90vh]">
        <VoiceAssistant connectionDetails={connectionDetails} config={config} />
      </div>
    </main>
  );
}
