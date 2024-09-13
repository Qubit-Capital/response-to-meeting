import React, { useState, useEffect } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import Sidebar from '@/components/SideBar';
import TopBar from '@/components/TopBar';
import EmailList from '@/components/EmailList';
import EmailDetails from '@/components/EmailDetails';
import { Email } from '@/models/Email';
import { Button } from '@/components/ui/button';

const Inbox: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [memory, setMemory] = useState<{ categories: string[], prospectNeeds: string[] }>({
    categories: [],
    prospectNeeds: []
  });

  const fetchEmails = async (page: number, search: string = '') => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/email?page=${page}&search=${encodeURIComponent(search)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }
      const data = await response.json();
      setEmails(data.emails);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMemory = async () => {
    try {
      const response = await fetch('/api/memory');
      if (!response.ok) {
        throw new Error('Failed to fetch memory');
      }
      const data = await response.json();
      setMemory({
        categories: data.categories.map((c: { name: string }) => c.name),
        prospectNeeds: data.prospectNeeds.map((p: { name: string }) => p.name)
      });
    } catch (error) {
      console.error('Error fetching memory:', error);
    }
  };

  useEffect(() => {
    fetchEmails(currentPage, searchQuery);
    fetchMemory();
  }, [currentPage, searchQuery]);

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleGenerateCase = async (email: Email) => {
    try {
      console.log('Sending request to generate case with memory:', memory);
      const response = await fetch('/api/generate-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate case');
      }

      const data = await response.json();
      console.log('Generated case:', data.case);

      // Refresh memory after generating case
      await fetchMemory();
    } catch (error) {
      console.error('Error generating case:', error);
    }
  };

  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal">
        {/* Left panel */}
        <ResizablePanel defaultSize={20} minSize={15}>
          <Sidebar />
        </ResizablePanel>

        <ResizableHandle />

        {/* Main content */}
        <ResizablePanel defaultSize={80}>
          <div className="h-full flex flex-col">
            <TopBar onSearch={handleSearch} />
            <div className="flex-grow overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">Loading...</div>
              ) : selectedEmail ? (
                <EmailDetails email={selectedEmail} onGenerateCase={handleGenerateCase} />
              ) : (
                <>
                  <EmailList emails={emails} onSelectEmail={handleSelectEmail} />
                  <div className="flex justify-between items-center p-4">
                    <Button onClick={handlePrevPage} disabled={currentPage === 1 || isLoading}>
                      Previous
                    </Button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <Button onClick={handleNextPage} disabled={currentPage === totalPages || isLoading}>
                      Next
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Inbox;