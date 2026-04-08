function parseOBJ(objText) {
  const sourcePositions = [];
  const sourceUVs = [];
  const sourceNormals = [];

  const finalPositions = [];
  const finalUVs = [];
  const finalNormals = [];
  const indices = [];

  const vertexMap = new Map();

  const lines = objText.split(/\r?\n/);

  function resolveIndex(objIndex, arrayLength) {
    const i = parseInt(objIndex, 10);
    if (Number.isNaN(i)) return null;

    // OBJ is 1-based. Negative indices are relative to the end.
    return i >= 0 ? i - 1 : arrayLength + i;
  }

  function getOrCreateVertex(faceToken) {
    if (vertexMap.has(faceToken)) {
      return vertexMap.get(faceToken);
    }

    const parts = faceToken.split("/");
    const vStr = parts[0];
    const vtStr = parts[1];
    const vnStr = parts[2];

    const vIndex = resolveIndex(vStr, sourcePositions.length);
    const vtIndex = vtStr ? resolveIndex(vtStr, sourceUVs.length) : null;
    const vnIndex = vnStr ? resolveIndex(vnStr, sourceNormals.length) : null;

    if (vIndex == null || vIndex < 0 || vIndex >= sourcePositions.length) {
      throw new Error(`Invalid position index in face token "${faceToken}"`);
    }

    const pos = sourcePositions[vIndex];
    finalPositions.push(pos[0], pos[1], pos[2]);

    if (vtIndex != null && vtIndex >= 0 && vtIndex < sourceUVs.length) {
      const uv = sourceUVs[vtIndex];
      finalUVs.push(uv[0], uv[1]);
    }

    if (vnIndex != null && vnIndex >= 0 && vnIndex < sourceNormals.length) {
      const n = sourceNormals[vnIndex];
      finalNormals.push(n[0], n[1], n[2]);
    }

    const newIndex = (finalPositions.length / 3) - 1;
    vertexMap.set(faceToken, newIndex);
    return newIndex;
  }

  for (let rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) continue;

    const parts = line.split(/\s+/);
    const type = parts[0];

    if (type === "v") {
      if (parts.length < 4) continue;
      sourcePositions.push([
        parseFloat(parts[1]),
        parseFloat(parts[2]),
        parseFloat(parts[3]),
      ]);
    } else if (type === "vt") {
      if (parts.length < 3) continue;
      sourceUVs.push([
        parseFloat(parts[1]),
        parseFloat(parts[2]),
      ]);
    } else if (type === "vn") {
      if (parts.length < 4) continue;
      sourceNormals.push([
        parseFloat(parts[1]),
        parseFloat(parts[2]),
        parseFloat(parts[3]),
      ]);
    } else if (type === "f") {
      if (parts.length < 4) continue;

      const faceVertexIndices = [];

      for (let i = 1; i < parts.length; i++) {
        const token = parts[i];
        if (!token) continue;
        faceVertexIndices.push(getOrCreateVertex(token));
      }

      // Fan triangulation:
      // [0,1,2,3] => [0,1,2], [0,2,3]
      for (let i = 1; i < faceVertexIndices.length - 1; i++) {
        indices.push(
          faceVertexIndices[0],
          faceVertexIndices[i],
          faceVertexIndices[i + 1]
        );
      }
    }
  }

  return {
    positions: finalPositions,
    uvs: finalUVs,
    normals: finalNormals,
    indices,
  };
}


async function loadOBJ(url) {
  const res = await fetch(url);
  const text = await res.text();
  return parseOBJ(text);
}
