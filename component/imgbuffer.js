import fs from 'fs'

export default async function ({  context }) {
    

    const imageBuffer = []

    if (process.env.SAMPLE_IMAGE_PATH != undefined) {

        console.log(`sample image path : ${process.env.SAMPLE_IMAGE_PATH}`)

        //get file extention
        const ext = process.env.SAMPLE_IMAGE_PATH.split('.').pop();

        if (ext == 'jpeg') {
            ext = 'jpg'
        }

        imageBuffer[0] = {
            data: fs.readFileSync(process.env.SAMPLE_IMAGE_PATH),
            type: {
                'jpg': 1,
                'png': 2,
                'bmp': 3
            }[ext]
        }
    }

    return {
        buffer: imageBuffer,
        getBuffer: function (_bank_index) {
            return imageBuffer[_bank_index]
        }
    }
}