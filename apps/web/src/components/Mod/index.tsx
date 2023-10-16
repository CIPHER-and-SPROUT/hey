import MetaTags from '@components/Common/MetaTags';
import Footer from '@components/Shared/Footer';
import { APP_NAME } from '@hey/data/constants';
import { PAGEVIEW } from '@hey/data/tracking';
import {
  CustomFiltersType,
  ExplorePublicationType,
  PublicationMetadataMainFocusType
} from '@hey/lens';
import {
  Button,
  Card,
  Checkbox,
  GridItemEight,
  GridItemFour,
  GridLayout
} from '@hey/ui';
import { Leafwatch } from '@lib/leafwatch';
import type { NextPage } from 'next';
import { useState } from 'react';
import Custom404 from 'src/pages/404';
import { usePreferencesStore } from 'src/store/preferences';
import { useEffectOnce } from 'usehooks-ts';

import Feed from './Feed';

const Mod: NextPage = () => {
  const isGardener = usePreferencesStore((state) => state.isGardener);
  const [refresing, setRefreshing] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [publicationTypes, setPublicationTypes] = useState([
    ExplorePublicationType.Post,
    ExplorePublicationType.Quote
  ]);
  const [mainContentFocus, setMainContentFocus] = useState<
    PublicationMetadataMainFocusType[]
  >([
    PublicationMetadataMainFocusType.Article,
    PublicationMetadataMainFocusType.Audio,
    PublicationMetadataMainFocusType.Embed,
    PublicationMetadataMainFocusType.Image,
    PublicationMetadataMainFocusType.Link,
    PublicationMetadataMainFocusType.TextOnly,
    PublicationMetadataMainFocusType.Video
  ]);
  const [customFilters, setCustomFilters] = useState([
    CustomFiltersType.Gardeners
  ]);

  useEffectOnce(() => {
    Leafwatch.track(PAGEVIEW, { page: 'mod' });
  });

  if (!isGardener) {
    return <Custom404 />;
  }

  const toggleMainContentFocus = (focus: PublicationMetadataMainFocusType) => {
    if (mainContentFocus.includes(focus)) {
      setMainContentFocus(mainContentFocus.filter((type) => type !== focus));
    } else {
      setMainContentFocus([...mainContentFocus, focus]);
    }
  };

  const togglePublicationType = (publicationType: ExplorePublicationType) => {
    if (publicationTypes.includes(publicationType)) {
      setPublicationTypes(
        publicationTypes.filter((type) => type !== publicationType)
      );
    } else {
      setPublicationTypes([...publicationTypes, publicationType]);
    }
  };

  return (
    <GridLayout>
      <MetaTags title={`Mod Center • ${APP_NAME}`} />
      <GridItemEight className="space-y-5">
        <Feed
          refresh={refresh}
          setRefreshing={setRefreshing}
          publicationTypes={publicationTypes}
          mainContentFocus={mainContentFocus}
          customFilters={customFilters}
        />
      </GridItemEight>
      <GridItemFour>
        <Card className="p-5">
          <Button
            disabled={refresing}
            className="w-full"
            onClick={() => setRefresh(!refresh)}
          >
            Refresh feed
          </Button>
          <div className="divider my-3" />
          <div className="space-y-2">
            <span className="font-bold">Publication filters</span>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <Checkbox
                onChange={() =>
                  togglePublicationType(ExplorePublicationType.Post)
                }
                checked={publicationTypes.includes(ExplorePublicationType.Post)}
                name="posts"
                label="Posts"
              />
              <Checkbox
                onChange={() =>
                  togglePublicationType(ExplorePublicationType.Quote)
                }
                checked={publicationTypes.includes(
                  ExplorePublicationType.Quote
                )}
                name="quotes"
                label="Quotes"
              />
            </div>
          </div>
          <div className="divider my-3" />
          <div className="space-y-2">
            <span className="font-bold">Media filters</span>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <Checkbox
                onChange={() =>
                  toggleMainContentFocus(
                    PublicationMetadataMainFocusType.Article
                  )
                }
                checked={mainContentFocus.includes(
                  PublicationMetadataMainFocusType.Article
                )}
                name="articles"
                label="Articles"
              />
              <Checkbox
                onChange={() =>
                  toggleMainContentFocus(PublicationMetadataMainFocusType.Audio)
                }
                checked={mainContentFocus.includes(
                  PublicationMetadataMainFocusType.Audio
                )}
                name="audio"
                label="Audio"
              />
              <Checkbox
                onChange={() =>
                  toggleMainContentFocus(PublicationMetadataMainFocusType.Embed)
                }
                checked={mainContentFocus.includes(
                  PublicationMetadataMainFocusType.Embed
                )}
                name="embeds"
                label="Embeds"
              />
              <Checkbox
                onChange={() =>
                  toggleMainContentFocus(PublicationMetadataMainFocusType.Image)
                }
                checked={mainContentFocus.includes(
                  PublicationMetadataMainFocusType.Image
                )}
                name="images"
                label="Images"
              />
              <Checkbox
                onChange={() =>
                  toggleMainContentFocus(PublicationMetadataMainFocusType.Link)
                }
                checked={mainContentFocus.includes(
                  PublicationMetadataMainFocusType.Link
                )}
                name="links"
                label="Links"
              />
              <Checkbox
                onChange={() =>
                  toggleMainContentFocus(
                    PublicationMetadataMainFocusType.TextOnly
                  )
                }
                checked={mainContentFocus.includes(
                  PublicationMetadataMainFocusType.TextOnly
                )}
                name="text"
                label="Text"
              />
              <Checkbox
                onChange={() =>
                  toggleMainContentFocus(PublicationMetadataMainFocusType.Video)
                }
                checked={mainContentFocus.includes(
                  PublicationMetadataMainFocusType.Video
                )}
                name="videos"
                label="Videos"
              />
            </div>
          </div>
          <div className="divider my-3" />
          <div className="space-y-2">
            <span className="font-bold">Custom filters</span>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <Checkbox
                onChange={() => {
                  if (customFilters.includes(CustomFiltersType.Gardeners)) {
                    setCustomFilters(
                      customFilters.filter(
                        (type) => type !== CustomFiltersType.Gardeners
                      )
                    );
                  } else {
                    setCustomFilters([
                      ...customFilters,
                      CustomFiltersType.Gardeners
                    ]);
                  }
                }}
                checked={customFilters.includes(CustomFiltersType.Gardeners)}
                name="gardeners"
                label="Gardeners"
              />
            </div>
          </div>
        </Card>
        <Footer />
      </GridItemFour>
    </GridLayout>
  );
};

export default Mod;
