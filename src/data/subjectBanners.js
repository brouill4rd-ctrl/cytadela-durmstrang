export const SUBJECT_BANNER_IMAGES = {
  zaklecia: '/baner_przedmioty_katedry/baner-zaklecia.png',
  transmutacja: '/baner_przedmioty_katedry/baner-transmutacja.png',
  eliksiry: '/baner_przedmioty_katedry/baner-eliksiry.png',
  zielarstwo: '/baner_przedmioty_katedry/baner-zielarstwo.png',
  magizoologia: '/baner_przedmioty_katedry/baner-magizoologia.png',
  'starozytne-runy': '/baner_przedmioty_katedry/baner-starozytne_runy.png',
  'biala-magia': '/baner_przedmioty_katedry/baner-biala_magia.png',
  'czarna-magia': '/baner_przedmioty_katedry/baner-cm.png',
  'klatwy-i-uroki': '/baner_przedmioty_katedry/baner-magia_wojenna.png',
};

export const getSubjectBannerImage = (subjectOrId) => {
  const subjectId = typeof subjectOrId === 'string' ? subjectOrId : subjectOrId?.id;
  return subjectId ? SUBJECT_BANNER_IMAGES[subjectId] : undefined;
};
