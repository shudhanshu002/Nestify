import { useState, useCallback } from 'react';
import API from '../api/client';

export const useProperties = () => {
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [singleProperty, setSingleProperty] = useState(null);

  const fetchProperties = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await API.get('/properties/search', { params });
      setProperties(data.data);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSingleProperty = async (id) => {
    setLoading(true);
    try {
      const { data } = await API.get(`/properties/${id}`);
      setSingleProperty(data.data);
      return data.data;
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  return { loading, properties, singleProperty, fetchProperties, fetchSingleProperty };
};