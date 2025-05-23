// 이미지 경로 객체를 받아서 => {키: Image객체} 로 돌려주는 함수
export function loadImages(paths) {
  const jobs = Object.entries(paths).map(([key, src]) => new Promise(res => {
    const img = new Image();
    img.src = src;
    img.onload = () => res([key, img]);
  }));
  return Promise.all(jobs).then(list => Object.fromEntries(list));
}
