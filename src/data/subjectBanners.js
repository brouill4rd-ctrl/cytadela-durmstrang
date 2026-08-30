export const SUBJECT_BANNER_IMAGES = {
  zaklecia: '/baner_przedmioty_katedry/baner-zaklecia.webp',
  transmutacja: '/baner_przedmioty_katedry/baner-transmutacja.webp',
  eliksiry: '/baner_przedmioty_katedry/baner-eliksiry.webp',
  zielarstwo: '/baner_przedmioty_katedry/baner-zielarstwo.webp',
  magizoologia: '/baner_przedmioty_katedry/baner-magizoologia.webp',
  'starozytne-runy': '/baner_przedmioty_katedry/baner-starozytne_runy.webp',
  'biala-magia': '/baner_przedmioty_katedry/baner-biala_magia.webp',
  'czarna-magia': '/baner_przedmioty_katedry/baner-cm.webp',
  'klatwy-i-uroki': '/baner_przedmioty_katedry/baner-magia_wojenna.webp',
};

export const getSubjectBannerImage = (subjectOrId) => {
  const subjectId = typeof subjectOrId === 'string' ? subjectOrId : subjectOrId?.id;
  return subjectId ? SUBJECT_BANNER_IMAGES[subjectId] : undefined;
};
