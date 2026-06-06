import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for fetching data
 * Includes caching, loading states, and error handling
 */
export const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cache = useRef({});

  const fetchData = useCallback(async () => {
    // Check cache
    if (cache.current[url] && !options.skipCache) {
      setData(cache.current[url]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const result = await response.json();
      cache.current[url] = result;
      setData(result);
    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  return { data, loading, error, refetch: fetchData };
};

export default useFetch;
