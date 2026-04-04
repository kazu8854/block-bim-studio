export function stripStub<T extends Record<string, unknown>>(
  row: T,
): Omit<T, '_stub' | '_stubLevel'> {
  const { _stub: _s, _stubLevel: _l, ...rest } = row;
  return rest;
}
