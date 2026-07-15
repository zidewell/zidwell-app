<<<<<<< HEAD
import { SubscriptionPageGuard } from "./SubscriptionGuard";
=======
// components/withSubscription.tsx
import { SubscriptionPageGuard } from "./SubscriptionGuard"; 
>>>>>>> f0dc9f163d2db4c6f24994ecb64105a7d59f7679

interface WithSubscriptionProps {
  requiredTier: 'free' | 'solopreneur' | 'sme' | 'enterprise' | 'corporation';
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