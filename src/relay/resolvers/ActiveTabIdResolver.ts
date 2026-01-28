import { graphql, readFragment } from 'relay-runtime';
import type { ActiveTabIdResolverFragment$key } from './__generated__/ActiveTabIdResolverFragment.graphql';

const fragment = graphql`
  fragment ActiveTabIdResolverFragment on Query {
    activeTabIdBacking
  }
`;

export default function ActiveTabIdResolver(rootKey: ActiveTabIdResolverFragment$key): string {
  const data = readFragment(fragment, rootKey);
  return data.activeTabIdBacking ?? 'all';
}
