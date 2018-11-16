/**
 * v0.1.0
 * [x] Drop images
 * [x] Simple layout
 * v0.1.1
 * [x] Export to png using domtoimage
 * v0.1.2
 * [x] Choose canvas’ dimentions and background color
 * v0.1.3
 * [x] Move scripts to the top of the HTML, defer loading
 * [x] Fix downloading big images, e.g. 1600×1600px
 * [x] Verify whether exported quality is ok (how big images do we need for print?)
 *
 * [ ] Block UI while exporting (<dialog>)
 * [ ] Don’t scale() canvas, but it’s container. That way we will not have to
 *     change --scale for exporting.
 * [ ] Initial zoom should be “fit to viewport”. Mark only that, 100%, min and max on the slider
 * [ ] Throttle canvas’ dimentions change
 * [ ] Hmmm… web components?
 * [ ] Wrap images in containers
 * [ ] When laying out, create slots and assign images to slots
 * [ ] Keep set of images with their natural dimentions and padding
 *     (images + slots = state)
 * [ ] When image loads, don’t recalculate whole layout, just this image
 * [ ] Use transform to scale and position images, transition
 * [ ] Recalulate layout with placeholders on dragOver
 * [ ] Fine tune images: containers’ positions
 * [ ] Fine tune images: images’ positions and scale
 * [ ] Choose gap between slots
 * [ ] Drag canvas to look around
 * [ ] Scroll to zoom canvas
 * [ ] Pinch to zoom canvas
 * [ ] Drag with mouse to rearrange images (show slots outlines)
 * [ ] Drag with touch to rearrange images (show slots outlines)
 * [ ] Different layouts
 * [ ] Come up with a name, description and keywords
 * [ ] Export without 3rd party libraries
 *     https://web.archive.org/web/20181006205840/https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Drawing_DOM_objects_into_a_canvas
 * - [ ] Use <svg><foreignObject> instead of <div id=canvas>
 * - [ ] Use only inline styles in canvas
 * [ ] Export web-optimized JPEG
 * [ ] Export web-optimized WebP
 */

(function() {

	function onDragIn (event)
	{
		event.preventDefault();
		event.currentTarget.classList.toggle('dragOver', true);
	}

	function onDragOut (e)
	{
		event.preventDefault();
		event.currentTarget.classList.toggle('dragOver', false);
	}


	function onDrop (event)
	{
		const canvas = document.getElementById('canvas');

		onDragOut(event);

		for (const file of event.dataTransfer.files)
		{
		    if (! /^image\//.test(file.type))
		    {
		    	alert(`Dropped non-image file: ${file.name}.`);
		        continue;
		    }

		    const img = document.createElement('img');
		    img.alt = file.name;
		    if (canvas.children[0].tagName !== 'IMG')
		    {
		    	canvas.textContent = '';
		    }
		    canvas.insertBefore(img, null);
		    layout(canvas);

            const reader = new FileReader();
            reader.onload = ({target: {result: dataURL}}) => {
                img.src = dataURL;
                img.onload = () => {
					img.alt += `, ${img.naturalWidth}×${img.naturalHeight}`;
					img.title = img.alt;
		    		layout(canvas);
                };
            };
            reader.readAsDataURL(file);
		}

	}

	function layout (canvas)
	{
		if (canvas.children[0].tagName !== 'IMG')
		{
			return;
		}

		const canvasWidth = canvas.clientWidth;
		const canvasHeight = canvas.clientHeight;
		const imgs = Array.from(canvas.children);
		const count = imgs.length;
		const gridSize = Math.ceil(Math.sqrt(count));

		console.group('recalc canvas', `${gridSize}×${gridSize}`);
		for (
			let
				idx = 0,
				col = 0,
				row = 0;
			idx < imgs.length;
			idx += 1,
			col = idx % gridSize,
			row = Math.floor(idx / gridSize)	
		)
		{
			const img = imgs[idx];
			let top = Math.round(row * canvasHeight / gridSize);
			let left = Math.round(col * canvasWidth / gridSize);
			let width = Math.round(canvasWidth / gridSize);
			let height = Math.round(canvasHeight / gridSize);
			let ratio;

			if (img.naturalWidth && img.naturalHeight)
			{
				ratio = img.naturalWidth / img.naturalHeight;
			}
			else
			{
				ratio = 1.0;
			}

			if (ratio < 1)
			{
				let newWidth = Math.round(height * ratio);
				left += (width - newWidth) / 2;
				width = newWidth;
			}
			else if (ratio > 1)
			{
				let newHeight = Math.round(width / ratio);
				top += (height - newHeight) / 2;
				height = newHeight;
			}

			img.style.position = 'absolute';
			img.style.top = `${top}px`;
			img.style.left = `${left}px`;
			img.style.width = `${width}px`;
			img.style.height = `${height}px`;
		}
		console.groupEnd();
	}


	function onScaleChange (event)
	{
		const scale = event.currentTarget.value;
		document.getElementById('canvas').style.setProperty('--scale', scale);
	}


	async function onExport (event)
	{
		event.preventDefault();

		const canvas = document.getElementById('canvas');
		const width = canvas.clientWidth;
		const height = canvas.clientHeight;
		const scale = canvas.style.getPropertyValue('--scale');
		canvas.style.setProperty('--scale', 1.0);
		const pngBlob = await domtoimage.toBlob(canvas, {
			width,
			height,
		});
		canvas.style.setProperty('--scale', scale);

		downloadBlob(pngBlob, `collage export ${width}x${height}.png`);
	}


	function downloadBlob (blob, filename)
	{
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.download = filename;
		a.href = url;
		a.rel = 'noopener';
		a.click();
		URL.revokeObjectURL(url);
		delete a;
	}


	function onWidthChange (event)
	{
		const canvas = document.getElementById('canvas');
		canvas.style.setProperty('--width', event.currentTarget.value);

		layout(canvas);
	}


	function onHeightChange (event)
	{
		const canvas = document.getElementById('canvas');
		canvas.style.setProperty('--height', event.currentTarget.value);

		layout(canvas);
	}


	function onBackgroundChange (event)
	{
		const canvas = document.getElementById('canvas');
		canvas.style.backgroundColor = event.currentTarget.value;
	}


	function init ()
	{
        const dropTarget = document.getElementById("main");
        dropTarget.addEventListener("dragover", onDragIn, false);
        dropTarget.addEventListener("dragleave", onDragOut, false);
        dropTarget.addEventListener("drop", onDrop, false);

        const scale = document.getElementById('scale');
        scale.addEventListener('input', onScaleChange, false);
        onScaleChange({currentTarget: scale});

        const width = document.getElementById('width');
        width.addEventListener('input', onWidthChange, false);
        onWidthChange({currentTarget: width});

        const height = document.getElementById('height');
        height.addEventListener('input', onHeightChange, false);
        onHeightChange({currentTarget: height});

        const background = document.getElementById('background');
        background.addEventListener('input', onBackgroundChange, false);
        onBackgroundChange({currentTarget: background});

        const exportButton = document.getElementById('export');
        exportButton.addEventListener('click', onExport, false);
	}

    init();

})();
