import type { Project } from '../models/project.js';
import type { IfcBinary } from './ifc-types.js';
import { IFC4_COORDINATION_BASE_STEP } from './ifc-base-template.js';
import { getIfcApi } from './ifc-wasm-init.js';
import {
  Handle,
  IFC4,
  IFCGEOMETRICREPRESENTATIONSUBCONTEXT,
  IFCOWNERHISTORY,
} from 'web-ifc';

export interface IfcSerializer {
  serialize(project: Project): Promise<IfcBinary>;
}

function stepEscape(s: string): string {
  return s.replace(/'/g, "''").slice(0, 200);
}

function baseStepForProject(project: Project): Uint8Array {
  const safeName = stepEscape(project.name);
  const step = IFC4_COORDINATION_BASE_STEP.replace(
    "FILE_NAME('export.ifc'",
    `FILE_NAME('${safeName}.ifc'`,
  ).replace('Default Storey', stepEscape(`${project.name} — Storey`));
  return new TextEncoder().encode(step);
}

export async function serializeProjectToIfcLevel0(
  project: Project,
): Promise<IfcBinary> {
  return serializeProjectToIfc(project);
}

/**
 * Level 2: web-ifc で IFC4 モデルを生成（IfcBuildingElementProxy + IfcBlock + Pset）
 */
export async function serializeProjectToIfc(project: Project): Promise<IfcBinary> {
  const api = await getIfcApi();
  const mid = api.OpenModel(baseStepForProject(project));
  if (mid < 0) {
    throw new Error('IFC ベースモデルを開けませんでした');
  }
  try {
    const ow = api.GetLineIDsWithType(mid, IFCOWNERHISTORY).get(0);
    const sub = api.GetLineIDsWithType(mid, IFCGEOMETRICREPRESENTATIONSUBCONTEXT).get(0);
    const storeyPlacementRef = 22;
    const storeyRef = 23;

    const posLen = (v: number) =>
      api.CreateIfcType(mid, 2815919920, v) as InstanceType<
        typeof IFC4.IfcPositiveLengthMeasure
      >;
    const label = (t: string) => new IFC4.IfcLabel(t);
    const realT = (v: number) => api.CreateIfcType(mid, 200335297, v);

    for (const b of project.blocks) {
      const { position: p, dimensions: d, rotation: r } = b;
      const pt = new IFC4.IfcCartesianPoint([
        posLen(p.x),
        posLen(p.y),
        posLen(p.z),
      ]);
      api.WriteLine(mid, pt);

      const zAxis = new IFC4.IfcDirection([realT(0), realT(1), realT(0)]);
      api.WriteLine(mid, zAxis);
      const xAxis = new IFC4.IfcDirection([
        realT(Math.cos(r.y)),
        realT(0),
        realT(Math.sin(r.y)),
      ]);
      api.WriteLine(mid, xAxis);
      const ax = new IFC4.IfcAxis2Placement3D(
        new Handle(pt.expressID, 1, pt),
        new Handle(zAxis.expressID, 1, zAxis),
        new Handle(xAxis.expressID, 1, xAxis),
      );
      api.WriteLine(mid, ax);

      const lp = new IFC4.IfcLocalPlacement(
        new Handle(storeyPlacementRef, 1, null),
        new Handle(ax.expressID, 1, ax),
      );
      api.WriteLine(mid, lp);

      const blk = new IFC4.IfcBlock(
        new Handle(ax.expressID, 1, ax),
        posLen(d.width),
        posLen(d.height),
        posLen(d.depth),
      );
      api.WriteLine(mid, blk);

      const sh = new IFC4.IfcShapeRepresentation(
        new Handle(sub, 1, null),
        null,
        label('CSG'),
        [new Handle(blk.expressID, 1, blk)],
      );
      api.WriteLine(mid, sh);

      const pds = new IFC4.IfcProductDefinitionShape(null, null, [
        new Handle(sh.expressID, 1, sh),
      ]);
      api.WriteLine(mid, pds);

      const gid = api.CreateIFCGloballyUniqueId(mid);
      const proxy = new IFC4.IfcBuildingElementProxy(
        gid,
        new Handle(ow, 1, null),
        label(b.name),
        null,
        label(b.ifcType),
        new Handle(lp.expressID, 1, lp),
        new Handle(pds.expressID, 1, pds),
        null,
        IFC4.IfcBuildingElementProxyTypeEnum.ELEMENT,
      );
      api.WriteLine(mid, proxy);

      const pBlockId = new IFC4.IfcPropertySingleValue(
        new IFC4.IfcIdentifier('BlockId'),
        null,
        label(b.id),
        null,
      );
      api.WriteLine(mid, pBlockId);
      const pCat = new IFC4.IfcPropertySingleValue(
        new IFC4.IfcIdentifier('Category'),
        null,
        label(b.category),
        null,
      );
      api.WriteLine(mid, pCat);
      const pW = new IFC4.IfcPropertySingleValue(
        new IFC4.IfcIdentifier('Width'),
        null,
        realT(d.width),
        null,
      );
      api.WriteLine(mid, pW);
      const pH = new IFC4.IfcPropertySingleValue(
        new IFC4.IfcIdentifier('Height'),
        null,
        realT(d.height),
        null,
      );
      api.WriteLine(mid, pH);
      const pDep = new IFC4.IfcPropertySingleValue(
        new IFC4.IfcIdentifier('Depth'),
        null,
        realT(d.depth),
        null,
      );
      api.WriteLine(mid, pDep);
      const pRy = new IFC4.IfcPropertySingleValue(
        new IFC4.IfcIdentifier('RotationY'),
        null,
        realT(r.y),
        null,
      );
      api.WriteLine(mid, pRy);

      const pset = new IFC4.IfcPropertySet(
        api.CreateIFCGloballyUniqueId(mid),
        new Handle(ow, 1, null),
        label('Pset_BlockBIMExport'),
        null,
        [
          new Handle(pBlockId.expressID, 1, pBlockId),
          new Handle(pCat.expressID, 1, pCat),
          new Handle(pW.expressID, 1, pW),
          new Handle(pH.expressID, 1, pH),
          new Handle(pDep.expressID, 1, pDep),
          new Handle(pRy.expressID, 1, pRy),
        ],
      );
      api.WriteLine(mid, pset);

      const relDef = new IFC4.IfcRelDefinesByProperties(
        api.CreateIFCGloballyUniqueId(mid),
        new Handle(ow, 1, null),
        null,
        null,
        [new Handle(proxy.expressID, 1, proxy)],
        new Handle(pset.expressID, 1, pset),
      );
      api.WriteLine(mid, relDef);

      const relSp = new IFC4.IfcRelContainedInSpatialStructure(
        api.CreateIFCGloballyUniqueId(mid),
        new Handle(ow, 1, null),
        null,
        null,
        [new Handle(proxy.expressID, 1, proxy)],
        new Handle(storeyRef, 1, null),
      );
      api.WriteLine(mid, relSp);
    }

    return api.SaveModel(mid);
  } finally {
    api.CloseModel(mid);
  }
}
