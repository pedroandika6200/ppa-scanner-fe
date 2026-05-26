import * as pdfjs from 'pdfjs-dist';
import { ref } from 'vue';

const { getDocument, GlobalWorkerOptions } = pdfjs;

export const fileToBase64 = async (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export const convertPDFToImage = async (file: File): Promise<string[]> => {
  GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;

  const images: string[] = [];
  const scale = 2;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    }).promise;

    const imageData = canvas.toDataURL('image/jpeg');
    images.push(imageData);
  }

  return images;
};


// export const convertPDFToImage = async (file: File) => {
//   GlobalWorkerOptions.workerSrc = workerUrl;

//   const arrayBuffer = await file.arrayBuffer();
//   const pdf = await getDocument({ data: arrayBuffer }).promise;
//   const page = await pdf.getPage(1);

//   const scale = 2;
//   const viewport = page.getViewport({ scale });

//   const canvas = document.createElement('canvas');
//   const context = canvas.getContext('2d')!;
//   canvas.width = viewport.width;
//   canvas.height = viewport.height - 100;

//   await page.render({
//     canvasContext: context,
//     viewport: viewport,
//   }).promise;

//   const imageData = canvas.toDataURL('image/jpeg');

//   return imageData;
// }

export const autoCropWhiteBorders = (image: HTMLImageElement) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = image.width;
  canvas.height = image.height;

  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let top = 0;
  let bottom = canvas.height;
  let left = 0;
  let right = canvas.width;

  const isWhite = (r: number, g: number, b: number, a: number) => {
    return r >= 250 && g >= 250 && b >= 250 && a > 0;
  };

  outer: for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      if (!isWhite(Number(data[idx]), Number(data[idx + 1]), Number(data[idx + 2]), Number(data[idx + 3]))) {
        top = y;
        break outer;
      }
    }
  }

  outer: for (let y = canvas.height - 1; y >= 0; y--) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      if (!isWhite(Number(data[idx]), Number(data[idx + 1]), Number(data[idx + 2]), Number(data[idx + 3]))) {
        bottom = y;
        break outer;
      }
    }
  }

  outer: for (let x = 0; x < canvas.width; x++) {
    for (let y = 0; y < canvas.height; y++) {
      const idx = (y * canvas.width + x) * 4;
      if (!isWhite(Number(data[idx]), Number(data[idx + 1]), Number(data[idx + 2]), Number(data[idx + 3]))) {
        left = x;
        break outer;
      }
    }
  }

  outer: for (let x = canvas.width - 1; x >= 0; x--) {
    for (let y = 0; y < canvas.height; y++) {
      const idx = (y * canvas.width + x) * 4;
      if (!isWhite(Number(data[idx]), Number(data[idx + 1]), Number(data[idx + 2]), Number(data[idx + 3]))) {
        right = x;
        break outer;
      }
    }
  }

  const width = right - left + 1;
  const height = bottom - top + 1;

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d')!;
  croppedCanvas.width = width;
  croppedCanvas.height = height;

  croppedCtx.drawImage(canvas, left, top, width, height, 0, 0, width, height);

  return croppedCanvas;
}

export const convertCanvasToFile = (
  canvas: HTMLCanvasElement,
  filename = 'cropped.jpeg',
  mimeType = 'image/jpeg'
) => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) throw new Error('Canvas is empty');
      const file = new File([blob], filename, { type: mimeType });
      resolve(file);
    }, mimeType);
  });
}

export const increaseContrast = (image: string, contrast: number, brightness: number): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      context.filter = `contrast(${contrast}%) brightness(${brightness}%)`;
      context.drawImage(img, 0, 0);

      resolve(canvas.toDataURL('image/jpeg', 2));
    };
    img.src = image;
  });
};

export const isImageZoomed = ref(false);

export const handleZoomIn = (e: MouseEvent) => {
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();

  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;

  const percentX = (offsetX / rect.width) * 100;
  const percentY = (offsetY / rect.height) * 100;

  target.style.transformOrigin = `${percentX}% ${percentY}%`;
  target.style.transform = 'scale(2)';

  isImageZoomed.value = true;
};

export const handleZoomReset = (e: MouseEvent) => {
  const target = e.currentTarget as HTMLElement;
  target.style.transform = 'scale(1)';
  target.style.transformOrigin = 'center center';

  isImageZoomed.value = false;
};
