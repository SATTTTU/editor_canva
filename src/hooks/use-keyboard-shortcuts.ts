import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/store/store';
import { setSelectedLayer } from '@/lib/store/editorSlice';

export function useKeyboardShortcuts() {
  const dispatch = useDispatch<AppDispatch>();
  const selectedLayerId = useSelector((state: RootState) => state.editor.selectedLayerId);
  const layers = useSelector((state: RootState) => state.editor.layers);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected layer
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedLayerId && selectedLayerId !== 'base-image') {
          dispatch(setSelectedLayer(null));
          // Additional logic to delete the layer would go here
        }
      }

      // Arrow keys for nudging
      if (selectedLayerId) {
        const nudgeAmount = e.shiftKey ? 10 : 1;
        const layer = layers.find(l => l.id === selectedLayerId);
        
        if (layer) {
          switch (e.key) {
            case 'ArrowLeft':
              // Additional logic to update layer position would go here
              e.preventDefault();
              break;
            case 'ArrowRight':
              e.preventDefault();
              break;
            case 'ArrowUp':
              e.preventDefault();
              break;
            case 'ArrowDown':
              e.preventDefault();
              break;
          }
        }
      }

      // Toggle guides with Cmd/Ctrl + G
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'g') {
        // Additional logic to toggle guides would go here
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerId, layers, dispatch]);
}