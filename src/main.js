const section = location.pathname.split('/').filter(Boolean)[0] || 'guest';
const page = 'reception';
const entries = {
  guest: ['Гостиница «Университетская» · Москва', 'mountGuest'],
  admin: ['Пульт гостиницы · Университетская', 'mountAdmin'],
  reception: ['Стойка регистрации · Университетская', 'mountReception'],
  master: ['Кабинет мастера · Университетская', 'mountMaster'],
};
document.title = entries[page][0];
function loadStyle(name) {
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = './src/' + name + '.css';
  const ready = new Promise((resolve, reject) => {
    style.onload = resolve;
    style.onerror = reject;
  });
  document.head.append(style);
  return ready;
}
const styles = [loadStyle(page)];
if (page === 'guest')
  styles.push(
    loadStyle('guestSections'),
    loadStyle('guestArt'),
    loadStyle('guestHotelDialogs'),
  );
if (page === 'master') styles.push(loadStyle('masterArt'));
if (page === 'admin') styles.push(loadStyle('adminCrm'));
const [module] = await Promise.all([import('./' + page + '.js'), ...styles]);
module[entries[page][1]](document.querySelector('#app'));
