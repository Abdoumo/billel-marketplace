import { useState, useEffect } from "react";
import { MessageCircle, Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/AuthProvider";

interface Question {
  id: string;
  questionText: string;
  answerText: string | null;
  answeredAt: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  createdAt: string;
}

export default function ListingQuestions({ listingId }: { listingId: string }) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, [listingId]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/listings/${listingId}/questions`);
      if (!response.ok) throw new Error("Failed to fetch questions");
      const data = await response.json();
      setQuestions(data.questions || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !user) {
      setError("Please log in to ask a question");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/listings/${listingId}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ questionText: newQuestion }),
      });

      if (!response.ok) throw new Error("Failed to post question");

      await fetchQuestions();
      setNewQuestion("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post question");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Questions & Answers</h3>
        <span className="ml-auto text-sm text-gray-600">
          {questions.length} question{questions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Ask Question Form */}
      {user && (
        <form onSubmit={handleSubmitQuestion} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Ask a question about this listing..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
          />
          <div className="mt-3 flex justify-end">
            <Button
              type="submit"
              disabled={submitting || !newQuestion.trim()}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Posting..." : "Ask Question"}
            </Button>
          </div>
        </form>
      )}

      {!user && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to ask questions about this listing.
          </AlertDescription>
        </Alert>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No questions yet. Be the first to ask!
          </p>
        ) : (
          questions.map((question) => (
            <div
              key={question.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
            >
              {/* Question */}
              <div className="mb-3">
                <p className="font-medium text-gray-900">{question.questionText}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Asked by {question.user.firstName} {question.user.lastName}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(question.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Answer */}
              {question.answerText ? (
                <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <p className="text-sm font-medium text-blue-900">Seller's Answer:</p>
                  <p className="text-sm text-blue-800 mt-1">{question.answerText}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Answered on{" "}
                    {new Date(question.answeredAt!).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                  <p className="text-sm text-yellow-800">
                    Waiting for seller to answer...
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
