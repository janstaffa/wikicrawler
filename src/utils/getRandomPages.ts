export const getRandomPages = async (n: number) => {
  if (n < 1) n = 1;
  return await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=${n}&format=json&origin=*`
  )
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      const pages = data?.query?.random as any[];
      if (!pages || pages.length === 0) return;
      const response = pages.map((page) => {
        const title = page.title as string;
        if (!title || typeof title !== 'string') return null;
        return 'https://en.wikipedia.org/wiki/' + title.replaceAll(' ', '_');
      });
      if (!response || response.length === 0) return;
      return response;
    });
};
