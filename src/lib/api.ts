// Helper function to trigger the export and download
export async function exportDesign(designId: string, format: 'png' | 'jpeg' = 'png') {
  try {
    const response = await fetch(`/api/export/${designId}`);
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    // Get the filename from the Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `design-${designId}.${format}`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+?)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Create a blob from the response
    const blob = await response.blob();
    
    // Create a download link and trigger it
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}

// Helper function to upload an asset
export async function uploadAsset(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/assets', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload asset');
  }

  return response.json();
}

// Helper function to save a design
export async function saveDesign(design: {
  title: string;
  width: number;
  height: number;
  layers?: Array<{
    assetId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    flipX: boolean;
    flipY: boolean;
    opacity: number;
    zIndex: number;
    cropX?: number | null;
    cropY?: number | null;
    cropW?: number | null;
    cropH?: number | null;
    visible: boolean;
    locked: boolean;
  }>;
}) {
  const response = await fetch('/api/designs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(design),
  });

  if (!response.ok) {
    throw new Error('Failed to save design');
  }

  return response.json();
}

// Helper function to update a design
export async function updateDesign(
  designId: string,
  updates: Partial<{
    title: string;
    width: number;
    height: number;
    layers: Array<{
      id?: string;
      assetId: string;
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      flipX: boolean;
      flipY: boolean;
      opacity: number;
      zIndex: number;
      cropX?: number | null;
      cropY?: number | null;
      cropW?: number | null;
      cropH?: number | null;
      visible: boolean;
      locked: boolean;
    }>;
  }>
) {
  const response = await fetch(`/api/designs/${designId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update design');
  }

  return response.json();
}