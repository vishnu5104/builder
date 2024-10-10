import type { Instance, Instances } from "./schema/instances";

export const ROOT_INSTANCE_ID = ":root";

const traverseInstances = (
  instances: Instances,
  instanceId: Instance["id"],
  callback: (instance: Instance) => false | void
) => {
  const instance = instances.get(instanceId);
  if (instance === undefined) {
    return;
  }
  const skipTraversingChildren = callback(instance);
  if (skipTraversingChildren === false) {
    return;
  }
  for (const child of instance.children) {
    if (child.type === "id") {
      traverseInstances(instances, child.value, callback);
    }
  }
};

export const findTreeInstanceIds = (
  instances: Instances,
  rootInstanceId: Instance["id"]
) => {
  const ids = new Set<Instance["id"]>([rootInstanceId]);
  traverseInstances(instances, rootInstanceId, (instance) => {
    ids.add(instance.id);
  });
  return ids;
};

export const findTreeInstanceIdsExcludingSlotDescendants = (
  instances: Instances,
  rootInstanceId: Instance["id"]
) => {
  const ids = new Set<Instance["id"]>([rootInstanceId]);
  traverseInstances(instances, rootInstanceId, (instance) => {
    ids.add(instance.id);
    if (instance.component === "Slot") {
      return false;
    }
  });
  return ids;
};

export const parseComponentName = (componentName: string) => {
  const parts = componentName.split(":");
  let namespace: undefined | string;
  let name: string;
  if (parts.length === 1) {
    [name] = parts;
  } else {
    [namespace, name] = parts;
  }
  return [namespace, name] as const;
};
