/**
 * `new SizePlugin(options)`
 * @param {Object} options
 * @param {string} [options.pattern] minimatch pattern of files to track
 * @param {string} [options.exclude] minimatch pattern of files NOT to track
 * @param {string} [options.filename] file name to save filesizes to disk
 * @param {boolean} [options.publish] option to publish filesizes to size-plugin-store
 * @param {boolean} [options.writeFile] option to save filesizes to disk
 * @param {function} [options.stripHash] custom function to remove/normalize hashed filenames for comparison
 * @param {(item:Item)=>string?} [options.decorateItem] custom function to decorate items
 * @param {(data:Data)=>string?} [options.decorateAfter] custom function to decorate all output
 * @public
 */
export default class SizePlugin {
    constructor(options: any);
    options: any;
    pattern: any;
    exclude: any;
    filename: any;
    reverseTemplate(filename: any, template: any): any;
    stripHash(filename: any): any;
    readFromDisk(filename: any): Promise<any>;
    writeToDisk(filename: any, stats: any): Promise<void>;
    save(files: any): Promise<void>;
    load(outputPath: any): Promise<any>;
    apply(compiler: any): Promise<void>;
    output: any;
    sizes: any;
    mode: any;
    outputSizes(assets: any): Promise<string>;
    getSizes(cwd: any): Promise<any>;
}
export type Item = {
    /**
     * Filename of the item
     */
    name: string;
    /**
     * Previous size, in kilobytes
     */
    sizeBefore: number;
    /**
     * Current size, in kilobytes
     */
    size: number;
    /**
     * Formatted current size
     */
    sizeText: string;
    /**
     * Difference from previous size, in kilobytes
     */
    delta: number;
    /**
     * Formatted size delta
     */
    deltaText: string;
    /**
     * Full item's default message
     */
    msg: string;
    /**
     * The item's default CLI color
     */
    color: string;
};
export type Data = {
    /**
     * List of file size items
     */
    sizes: Item[];
    /**
     * Current buffered output
     */
    output: string;
};
