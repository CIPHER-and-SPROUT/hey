import UserProfile from '@components/Shared/UserProfile';
import type { LensterPublication } from '@generated/lenstertypes';
import getAppName from '@lib/getAppName';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { FC, Ref } from 'react';
import { useRef } from 'react';
import { useEffect } from 'react';

import PublicationActions from './Actions';
import HiddenPublication from './HiddenPublication';
import PublicationBody from './PublicationBody';
import PublicationStats from './PublicationStats';
import ThreadBody from './ThreadBody';

dayjs.extend(relativeTime);

interface Props {
  publication: LensterPublication;
  postContainerRef?: Ref<HTMLDivElement>;
}

const FullPublication: FC<Props> = ({ publication, postContainerRef }) => {
  const threadRef = useRef<HTMLDivElement>(null);
  const isMirror = publication.__typename === 'Mirror';
  const profile = isMirror ? publication?.mirrorOf?.profile : publication?.profile;
  const timestamp = isMirror ? publication?.mirrorOf?.createdAt : publication?.createdAt;
  const commentOn = publication.commentOn as LensterPublication;
  const mainPost = commentOn?.mainPost as LensterPublication;

  // Count check to show the publication stats only if the publication has a comment, like or collect
  const mirrorCount = isMirror
    ? publication?.mirrorOf?.stats?.totalAmountOfMirrors
    : publication?.stats?.totalAmountOfMirrors;
  const reactionCount = isMirror
    ? publication?.mirrorOf?.stats?.totalUpvotes
    : publication?.stats?.totalUpvotes;
  const collectCount = isMirror
    ? publication?.mirrorOf?.stats?.totalAmountOfCollects
    : publication?.stats?.totalAmountOfCollects;
  const showStats = mirrorCount > 0 || reactionCount > 0 || collectCount > 0;

  useEffect(() => {
    if (threadRef.current && publication.commentOn) {
      threadRef.current?.scrollIntoView({ block: 'start' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadRef]);

  return (
    <article className="p-5">
      {publication.commentOn && (
        <div ref={postContainerRef}>
          {mainPost ? <ThreadBody publication={mainPost} /> : null}
          <ThreadBody publication={commentOn} />
        </div>
      )}
      <div ref={threadRef} className="scroll-mt-20">
        <div className="flex justify-between pb-4 space-x-1.5">
          <UserProfile profile={profile ?? publication?.collectedBy?.defaultProfile} showPreviewCard />
        </div>
        <div className="ml-[53px]">
          {publication?.hidden ? (
            <HiddenPublication type={publication.__typename} />
          ) : (
            <>
              <PublicationBody publication={publication} />
              <div className="text-sm text-gray-500 my-3">
                <span>{dayjs(new Date(timestamp)).format('hh:mm A · MMM D, YYYY')}</span>
                {publication?.appId ? <span> · Posted via {getAppName(publication?.appId)}</span> : null}
              </div>
              {showStats && (
                <>
                  <div className="divider" />
                  <PublicationStats publication={publication} />
                </>
              )}
              <div className="divider" />
              <PublicationActions publication={publication} isFullPublication />
            </>
          )}
        </div>
      </div>
    </article>
  );
};

export default FullPublication;
