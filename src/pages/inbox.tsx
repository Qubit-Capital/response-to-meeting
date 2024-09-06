import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

const Inbox: React.FC = () => {
  const emails = [
    { id: 1, from: 'William Smith', subject: 'Meeting Tomorrow', preview: `Hi, let's have a meeting tomorrow to discuss the project. I've been reviewing the project details and have some ideas I'd like to share. It's...`, date: '11 months ago', tags: ['meeting', 'work', 'important'] },
    { id: 2, from: 'Alice Smith', subject: 'Re: Project Update', preview: `Thank you for the project update. It looks great! I've gone through the report, and the progress is impressive. The team has done a fantastic job...`, date: '11 months ago', tags: ['work', 'important'] },
    { id: 3, from: 'Bob Johnson', subject: 'Weekend Plans', preview: `Any plans for the weekend? I was thinking of going hiking in the nearby mountains. It's been a while since we had some outdoor fun. If you're...`, date: 'over 1 year ago', tags: ['personal'] },
    { id: 4, from: 'Emily Davis', subject: 'Re: Question about Budget', preview: `I have a question about the budget for the upcoming project. It seems like there's a discrepancy in the allocation of resources. I've reviewed the...`, date: 'over 1 year ago', tags: ['work', 'budget'] },
    { id: 5, from: 'Michael Brown', subject: 'New Product Launch', preview: `We're excited to announce the launch of our new product next month. I'd like to schedule a meeting to discuss the marketing strategy and...`, date: '2 days ago', tags: ['work', 'important'] },
    { id: 6, from: 'Sarah Wilson', subject: 'Team Building Event', preview: `Hi everyone, I'm organizing a team building event for next month. I've got some fun activities planned, and I'd love to get your input on...`, date: '1 week ago', tags: ['work', 'social'] },
    { id: 7, from: 'David Lee', subject: 'Quarterly Report', preview: `The quarterly report is ready for review. I've attached the document to this email. Please take a look and let me know if you have any questions or...`, date: '3 days ago', tags: ['work', 'report'] },
    { id: 8, from: 'Lisa Taylor', subject: 'Vacation Request', preview: `I'd like to request some time off next month. I'm planning a family vacation and would need two weeks off. Please let me know if this is...`, date: '5 days ago', tags: ['personal', 'vacation'] },
    // Add more sample emails as needed
  ]

  const [selectedEmail, setSelectedEmail] = useState(emails[0])
  const [currentPage, setCurrentPage] = useState(1)
  const emailsPerPage = 5

  const indexOfLastEmail = currentPage * emailsPerPage
  const indexOfFirstEmail = indexOfLastEmail - emailsPerPage
  const currentEmails = emails.slice(indexOfFirstEmail, indexOfLastEmail)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  return (
    <ResizablePanelGroup direction="horizontal" className="h-screen">
      {/* Sidebar */}
      <ResizablePanel defaultSize={20} minSize={15}>
        <div className="bg-gray-100 p-4 h-full">
          <h2 className="text-lg font-semibold mb-4">Alicia Koch</h2>
          <nav>
            <Button variant="ghost" className="w-full justify-start mb-1">
              <span className="mr-2">📥</span> Inbox <Badge className="ml-auto">128</Badge>
            </Button>
            <Button variant="ghost" className="w-full justify-start mb-1">
              <span className="mr-2">📄</span> Drafts <Badge className="ml-auto">9</Badge>
            </Button>
            <Button variant="ghost" className="w-full justify-start mb-1">
              <span className="mr-2">📤</span> Sent
            </Button>
            <Button variant="ghost" className="w-full justify-start mb-1">
              <span className="mr-2">✅</span> Approved
            </Button>
            <Button variant="ghost" className="w-full justify-start mb-1">
              <span className="mr-2">❌</span> Unapproved
            </Button>
            <Button variant="ghost" className="w-full justify-start mb-1">
              <span className="mr-2">🗃️</span> Archived
            </Button>
            <Button variant="ghost" className="w-full justify-start mb-1">
              <span className="mr-2">🗑️</span> Junk <Badge className="ml-auto">23</Badge>
            </Button>
            <Button variant="ghost" className="w-full justify-start mb-1">
              <span className="mr-2">🗑️</span> Trash
            </Button>
          </nav>
        </div>
      </ResizablePanel>

      <ResizableHandle />

      {/* Main content */}
      <ResizablePanel defaultSize={45} minSize={30}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <h1 className="text-2xl font-bold">Inbox</h1>
            <div className="flex space-x-2">
              <Button variant="ghost">All mail</Button>
              <Button variant="ghost">Unread</Button>
              <Button variant="ghost">🗑️</Button>
              <Button variant="ghost">🕒</Button>
            </div>
          </div>

          {/* Search bar */}
          <div className="p-4">
            <Input placeholder="Search" className="w-full" />
          </div>

          {/* Email list */}
          <ScrollArea className="flex-1">
            {currentEmails.map((email) => (
              <div 
                key={email.id} 
                className="p-4 border-b hover:bg-gray-100 cursor-pointer"
                onClick={() => setSelectedEmail(email)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <Avatar className="mr-2">
                      <AvatarFallback>{email.from.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold">{email.from}</h3>
                  </div>
                  <span className="text-sm text-gray-500">{email.date}</span>
                </div>
                <h4 className="font-medium mb-1">{email.subject}</h4>
                <p className="text-sm text-gray-600 mb-2">{email.preview}</p>
                <div className="flex space-x-2">
                  {email.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </ScrollArea>

          {/* Pagination */}
          <div className="flex justify-center items-center p-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => paginate(currentPage - 1)} 
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="mx-4">
              Page {currentPage} of {Math.ceil(emails.length / emailsPerPage)}
            </span>
            <Button 
              variant="outline" 
              onClick={() => paginate(currentPage + 1)} 
              disabled={currentPage === Math.ceil(emails.length / emailsPerPage)}
            >
              Next
            </Button>
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle />

      {/* Email preview pane */}
      <ResizablePanel defaultSize={35} minSize={20}>
        <div className="p-4 h-full">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">{selectedEmail.from}</h2>
            <p className="text-sm text-gray-500">{selectedEmail.subject}</p>
            <p className="text-sm text-gray-500">Reply-To: {selectedEmail.from.toLowerCase().replace(' ', '')}@example.com</p>
          </div>
          <div className="mb-4">
            <p>{selectedEmail.preview}</p>
          </div>
          <Input placeholder={`Reply ${selectedEmail.from}...`} className="w-full" />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

export default Inbox