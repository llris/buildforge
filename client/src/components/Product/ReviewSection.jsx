export default function ReviewSection({ reviews }) {
  if (!reviews || reviews.length === 0) {
    return <div className="text-muted-foreground p-4">No reviews yet.</div>;
  }

  return (
    <div className="space-y-6">
      {reviews.map(review => (
        <div key={review.id} className="border-b border-border pb-6 last:border-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary text-secondary-foreground font-semibold">
              {review.user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">
                  {review.user?.email.split('@')[0]}
                </p>
                {review.isVerifiedPurchase && (
                  <span className="inline-flex items-center gap-1 rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-600">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Verified
                  </span>
                )}
              </div>
              <div className="flex text-yellow-400 mt-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`h-3 w-3 ${i < review.rating ? 'fill-current' : 'fill-muted text-muted'}`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            <div className="ml-auto text-xs text-muted-foreground">
              {new Date(review.createdAt).toLocaleDateString()}
            </div>
          </div>
          {review.comment && (
            <p className="mt-2 text-sm text-foreground/90 pl-13">
              {review.comment}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
