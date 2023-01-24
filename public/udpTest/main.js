// import { fabric } from "fabric"; //es6 방식
const fabric = window.fabric;

async function update() {

    const fbCanvas = theApp.fbCanvas;

    for (let _y = 0; _y < 4; _y++) {
        for (let _x = 0; _x < 4; _x++) {



            let index = _x + _y * 4;
            let imgObject = fbCanvas.getObjects().filter(o => o.id === `cell_${_x}_${_y}`)

            let resp = await fetch(`/api/v1/getImage?bankId=2&index=${index}`, {
                method: 'GET',
                // body: ['/home/gbox3d/work/dataset/fruts_nuts/images', '0.jpg'].join('\n'),
                //body : '/home/gbox3d/work/dataset/fruts_nuts',
                headers: new Headers({
                    "Content-Type": 'application/text'
                })
            });

            // console.log(resp);

            if(resp.status == 200){
                let img = await resp.blob();
                // console.log(img);
                let imgURL = URL.createObjectURL(img);

                if (imgObject.length > 0) {
                    try {
                        imgObject[0].setSrc(imgURL, function () {
                            fbCanvas.renderAll();
                        });
                    }
                    catch (e) {
                        console.log(e);
                    }
                }
                else {
                    try {
                        fabric.Image.fromURL(imgURL, function (img) {
                            img.set('left', 160 * _x);
                            img.set('top', 120 * _y);
                            img.set('id', `cell_${_x}_${_y}`);
                            fbCanvas.add(img);
                        });
                    }
                    catch (e) {
                        console.log(e);
                    }
                }
            }

            // if (imgObject.length > 0) {
            //     try {
            //         imgObject[0].setSrc(`/api/v1/getImage?bankId=2&index=${index}`, function () {
            //             fbCanvas.renderAll();
            //         });
            //     }
            //     catch (e) {
            //         console.log(e);
            //     }
            // }
            // else {
            //     try {
            //         fabric.Image.fromURL(`/api/v1/getImage?bankId=2&index=${index}`, function (img) {
            //             img.set('left', 160 * _x);
            //             img.set('top', 120 * _y);
            //             fbCanvas.add(img);
            //         });
            //     }
            //     catch (e) {
            //         console.log(e);
            //     }
            // }
        }
    }

}

function main() {

    // const fbCanvas = new fabric.Canvas('main-canvas', {
    const fbCanvas = new fabric.StaticCanvas('main-canvas', {
        backgroundColor: '#a278ff',
        preserveObjectStacking: true, //선택한 오브잭트 현재 z 순서  유지
        enableRetinaScaling: false //레티나 비활성화
    });
    fbCanvas.setHeight(640);
    fbCanvas.setWidth(640);

    theApp.fbCanvas = fbCanvas;


    const uiContainer = document.getElementById('ui-container');

    uiContainer.addEventListener('click', function (e) {
        console.log(e.target.id);

        update();
    });

    // async function _loop() {
        
    //     await update();

    //     window.requestAnimationFrame(_loop);
    // }
    // _loop();

    // update();

    console.log(fabric.version)
}

export default main;