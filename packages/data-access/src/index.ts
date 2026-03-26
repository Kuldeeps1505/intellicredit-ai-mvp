export interface RepositoryHealth {
  service: string;
  healthy: boolean;
}

export function getRepositoryHealth(service: string): RepositoryHealth {
  return { service, healthy: true };
}
