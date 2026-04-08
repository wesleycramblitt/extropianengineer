export function saveJson(data, fileName) {
    // Convert object to string
    const jsonStr = JSON.stringify(data, null, 2); 

    // Create a blob and an invisible download link
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export async function loadJson(fileName) {
  try {
    const response = await fetch(fileName); // Path to your file
    if (!response.ok) throw new Error('File not found');
    const data = await response.json();
      return data;
  } catch (error) {
    console.error('Error:', error);
      return null;
  }
}

