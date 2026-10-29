// src/components/modals/ReviewModal.jsx
const ReviewModal = ({ booking, onClose }) => {
  const [review, setReview] = useState({
    ratings: { cleanliness: 5, maintenance: 5, safety: 5, services: 5 },
    safetySignals: { noiseLevel: 'Moderate', internetSpeed: 'Good', powerBackupReliability: true },
    comment: ""
  });

  const handleSubmit = async () => {
    const formData = new FormData(); // Using FormData to handle images + JSON
    formData.append('ratings', JSON.stringify(review.ratings));
    formData.append('safetySignals', JSON.stringify(review.safetySignals));
    formData.append('comment', review.comment);
    formData.append('bookingId', booking._id);

    await API.post(`/reviews/${booking.property._id}`, formData);
    alert("Review Published! You earned a 'Verified Reviewer' badge.");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[3.5rem] p-12 overflow-y-auto max-h-[90vh] shadow-2xl">
        <h2 className="text-4xl font-black italic tracking-tighter mb-8">How was your stay?</h2>
        
        {/* 1. Multi-Point Ratings Grid */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          {Object.keys(review.ratings).map((key) => (
            <div key={key} className="space-y-2">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{key}</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star} 
                    size={20} 
                    onClick={() => setReview({...review, ratings: {...review.ratings, [key]: star}})}
                    className={`cursor-pointer transition ${star <= review.ratings[key] ? 'text-yellow-400 fill-current' : 'text-gray-200'}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 2. Safety Signals (The OYO-Grade Details) */}
        <div className="bg-gray-50 p-8 rounded-[2.5rem] mb-8 space-y-6">
           <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Environment Signals</h4>
           <div className="flex flex-wrap gap-4">
              <select className="bg-white p-3 rounded-xl font-bold text-xs outline-none border border-gray-100" onChange={(e) => setReview({...review, safetySignals: {...review.safetySignals, noiseLevel: e.target.value}})}>
                <option>Low Noise</option><option>Moderate</option><option>High Noise</option>
              </select>
              <label className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-100 cursor-pointer">
                 <input type="checkbox" className="accent-primary" checked={review.safetySignals.powerBackupReliability} onChange={(e) => setReview({...review, safetySignals: {...review.safetySignals, powerBackupReliability: e.target.checked}})}/>
                 <span className="text-xs font-bold">Reliable Power Backup</span>
              </label>
           </div>
        </div>

        <textarea 
          className="w-full bg-gray-50 p-6 rounded-[2rem] text-sm outline-none h-32 border border-transparent focus:border-primary transition"
          placeholder="What should the next guest know?"
          value={review.comment}
          onChange={(e) => setReview({...review, comment: e.target.value})}
        />

        <button onClick={handleSubmit} className="w-full bg-gray-900 text-white py-6 rounded-3xl font-black text-xl hover:bg-primary transition shadow-xl mt-8">
          Publish Verified Review
        </button>
      </div>
    </div>
  );
};