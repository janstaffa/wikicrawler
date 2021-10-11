export const getPageTitle = (url: string) => {
  return fetch(url)
    .then((data) => data.text())
    .then((data) => {
      if (!data) throw new Error("URL can't be reached.");
      const _document = document.createElement('html');
      _document.innerHTML = data;

      const body = _document.querySelector('body');

      if (!body) return null;

      const pageTitle = (
        body.querySelector('#firstHeading') as HTMLHeadingElement
      )?.innerText;
      return pageTitle || null;
    });
};
