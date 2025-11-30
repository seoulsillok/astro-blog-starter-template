import * as topojson from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, Geometry } from 'geojson';

export interface SeoulTopology extends Topology {
  objects: {
    seoul_submunicipalities_geo: GeometryCollection;
  };
}

export interface MergedFeature {
  type: 'Feature';
  geometry: Geometry;
  properties: {
    name: string;
    code: string;
    guCode: string;
  };
}

export function processSeoulData(topology: SeoulTopology): FeatureCollection<Geometry, MergedFeature['properties']> {
  const geojson = topojson.feature(topology, topology.objects.seoul_submunicipalities_geo) as unknown as FeatureCollection<Geometry, { code: string; name: string }>;

  const featuresByName = new Map<string, any[]>();

  geojson.features.forEach(feature => {
    const originalName = feature.properties.name;
    let mergedName = originalName.replace(/[0-9·]/g, '');

    if (featuresByName.has(mergedName)) {
      featuresByName.get(mergedName)!.push(feature);
    } else {
      featuresByName.set(mergedName, [feature]);
    }
  });

  const mergedFeatures: any[] = [];

  const objects = topology.objects.seoul_submunicipalities_geo.geometries;

  const groups = new Map<string, any[]>();

  objects.forEach((obj: any) => {
    const originalName = obj.properties.name;
    let mergedName = originalName.replace(/[0-9·]/g, '');

    if (!groups.has(mergedName)) {
      groups.set(mergedName, []);
    }
    groups.get(mergedName)!.push(obj);
  });

  for (const [name, groupObjects] of groups) {
    const mergedGeometry = topojson.merge(topology, groupObjects);
    const representative = groupObjects[0].properties;
    const guCode = representative.code.substring(0, 5);

    mergedFeatures.push({
      type: 'Feature',
      geometry: mergedGeometry,
      properties: {
        name: name,
        code: representative.code,
        guCode: guCode
      }
    });
  }

  return {
    type: 'FeatureCollection',
    features: mergedFeatures
  };
}
