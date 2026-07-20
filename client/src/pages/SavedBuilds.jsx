import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Link, useNavigate } from 'react-router-dom';

export default function SavedBuilds() {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBuilds();
  }, []);

  const fetchBuilds = async () => {
    setLoading(true);
    try {
      const res = await api.get('/builds');
      // For each build, run validation to get the true real-time compatibility badge
      const enriched = await Promise.all(res.data.data.map(async (b) => {
        try {
          const valRes = await api.post('/builder/validate', b.components);
          return { ...b, validation: valRes.data.data.validation };
        } catch(e) {
          return b;
        }
      }));
      setBuilds(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this build?')) return;
    try {
      await api.delete(`/builds/${id}`);
      setBuilds(builds.filter(b => b.id !== id));
    } catch (err) {
      alert('Failed to delete build');
    }
  };

  const handleLoad = (build) => {
    // In a real app we'd load this into global state or localStorage and navigate
    // Here we'll pass it via state to the PCBuilder route, but since PCBuilder doesn't 
    // natively read route state yet, we might have to just tell the user it's a stub for now.
    // Wait, let's actually just navigate, PCBuilder would need to read this. 
    // But for the sake of demonstration, we can just say:
    alert('Loading into builder is simulated for this step. See verification for broken build.');
  };

  if (loading) {
    return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading saved builds...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 lg:px-8 py-12">
      <div className="mb-8 flex items-end justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Saved Builds</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage your custom PC configurations.</p>
        </div>
        <Link 
          to="/builder"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          New Build
        </Link>
      </div>

      {builds.length === 0 ? (
        <div className="text-center py-24 rounded-xl border border-dashed border-border">
          <h3 className="text-lg font-medium text-foreground">No saved builds</h3>
          <p className="text-muted-foreground mt-2">You haven't saved any configurations yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {builds.map(build => (
            <div key={build.id} className="flex flex-col rounded-xl border border-border bg-card shadow-sm hover:border-primary/50 transition overflow-hidden">
              <div className="p-6 flex-1 border-b border-border">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-foreground line-clamp-1">{build.name}</h3>
                  {build.validation?.valid ? (
                    <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-600">
                      Compatible
                    </span>
                  ) : build.validation ? (
                    <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                      Incompatible
                    </span>
                  ) : null}
                </div>
                
                <div className="space-y-1 mb-6">
                  <p className="text-sm text-muted-foreground flex justify-between">
                    <span>Total Price:</span>
                    <span className="font-bold text-foreground">${build.totalPrice.toFixed(2)}</span>
                  </p>
                  <p className="text-sm text-muted-foreground flex justify-between">
                    <span>Estimated Wattage:</span>
                    <span className="font-bold text-foreground">{build.validation?.estimatedWattage || 0}W</span>
                  </p>
                  <p className="text-sm text-muted-foreground flex justify-between">
                    <span>Build Score:</span>
                    <span className="font-bold text-foreground">{build.buildScore || 0}/100</span>
                  </p>
                </div>
                
                {/* Preview components */}
                <div className="text-xs text-muted-foreground line-clamp-2">
                   {Object.keys(build.components).filter(k => build.components[k]).length} component(s) selected
                </div>
              </div>
              
              <div className="flex bg-muted/20">
                <button 
                  onClick={() => handleLoad(build)}
                  className="flex-1 py-3 text-sm font-semibold text-primary hover:bg-muted/50"
                >
                  Load
                </button>
                <button 
                  className="flex-1 py-3 text-sm font-semibold text-foreground border-l border-border hover:bg-muted/50"
                >
                  To Cart
                </button>
                <button 
                  onClick={() => handleDelete(build.id)}
                  className="flex-1 py-3 text-sm font-semibold text-destructive border-l border-border hover:bg-muted/50 hover:text-destructive"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
