// 301 redirects from the old WordPress site (aircampustroyes.fr, crawled 2026-09-23 — see
// design/old-site/urls.json) to the new pages. Pages that kept their URL need no entry.
// Checked by tests/unit/redirects.test.ts: every destination must be an existing page.

const to = (destination) => ({ status: 301, destination });

/** @type {Record<string, { status: 301; destination: string }>} */
export const redirects = {
  // Pages moved or merged
  '/lassociation/': to('/'),
  '/lassociation/plan-dacces/': to('/plan-dacces/'),
  '/le-brevet-dinitiation-aeronautique-bia/': to('/apprendre-a-piloter/'),
  '/apprendre-a-piloter/le-brevet-de-base-bb/': to(
    '/apprendre-a-piloter/licence-pilote-prive-ppl/',
  ),
  '/cout-dune-formation-2/': to('/nos-tarifs/'),
  '/documentations/voler-aux-usa/': to('/liens-utiles/'),

  // Archives / galleries
  '/photos/': to('/nos-avions/'),
  '/photos/page/2/': to('/nos-avions/'),
  '/diaporama-dimages/': to('/nos-avions/'),
  '/actualites/': to('/'),

  // Old blog posts (no blog on the new site)
  '/2013/09/02/bia-20132014/': to('/apprendre-a-piloter/'),
  '/2014/05/23/air-campus-troyes/': to('/'),
  '/2014/05/26/slide-1/': to('/'),
  '/2014/06/02/les-chateaux-de-la-loire/': to('/'),
  '/2014/06/06/puy-de-dome/': to('/'),
  '/2014/07/04/navigations-pilotes/': to('/'),
  '/2014/07/30/bretagne-by-air/': to('/'),
  '/2014/08/10/video-bretagne-en-cessna-172/': to('/'),
  '/2014/08/25/slide-4/': to('/'),
  '/2015/02/28/new-video-2015/': to('/'),
  '/2015/08/23/la-normandie/': to('/'),
  '/2015/08/27/nav-en-charente-maritime/': to('/'),
  '/2015/09/04/video-air-campus/': to('/'),
  '/2015/11/07/arcachon-biscarosse-dune-du-pyla-par-michel-rigaud/': to('/'),
  '/2016/09/04/sliden/': to('/'),
  '/2016/09/04/troyes-nantes-atlantique/': to('/'),
  '/2017/02/13/corse/': to('/'),
  '/2017/02/14/grenoble/': to('/'),
  '/2018/08/25/slide-5/': to('/'),
  '/2019/09/28/tour-deurope-ete-2019/': to('/'),
  '/2022/06/29/journees-portes-ouvertes/': to('/'),
  '/2022/08/03/bretagne-2022/': to('/'),

  // File redirects (no trailing slash) live in public/_redirects.
};
