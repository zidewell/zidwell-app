// components/withSubscription.tsx
import { SubscriptionPageGuard } from "./SubscriptionGuard";

interface WithSubscriptionProps {
  requiredTier: 'free' | 'growth' | 'premium' | 'elite';
  featureKey: string;
  title?: string;
  description?: string;
}

export function withSubscription<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithSubscriptionProps
) {
  return function WithSubscriptionComponent(props: P) {
    return (
      <SubscriptionPageGuard {...options}>
        <WrappedComponent {...props} />
      </SubscriptionPageGuard>
    );
  };
}