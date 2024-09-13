import React, { useState, useEffect } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import Sidebar from '@/components/Sidebar';
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

  const fetchEmails = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/email?page=${page}`);
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

  useEffect(() => {
    fetchEmails(currentPage);
  }, [currentPage]);

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

  return (
    <ResizablePanelGroup direction="horizontal" className="h-screen">
      {/* Sidebar */}
      <ResizablePanel defaultSize={20} minSize={15}>
        <Sidebar />
      </ResizablePanel>

      <ResizableHandle />

      {/* Main content */}
      <ResizablePanel defaultSize={80}>
        <div className="flex flex-col h-full">
          <TopBar />
          <div className="flex-grow overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">Loading...</div>
            ) : selectedEmail ? (
              <EmailDetails email={selectedEmail} />
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
  );
};

export default Inbox;