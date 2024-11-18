const height = 500;
const width = 1500;
const heightMargin = 37;
const nodeSize = 3;
const offset = 500;
const transitionDuration = 2000;
const buttonWidth = 150;
const buttonHeight = 25;

interface TreeNode {
    id?: number;
    name: string;
    children?: TreeNode[];
    relativeHeight?: number;
    isFingerTree?: boolean;
}

let nodeMap: Map<any, TreeNode> = new Map<any, TreeNode>();

function getNode(key: any, isFingerTree: boolean): TreeNode {
    let out: TreeNode = nodeMap.get(key);
    if (!out) {
        out = {
            name: "Node",
            children: [],
            isFingerTree: isFingerTree
        };
        nodeMap.set(key, out);
    }
    out.isFingerTree = isFingerTree;
    return out;
}

function connectNodes(parent: TreeNode, child: TreeNode, leftEnd: boolean = false) {
    if (!parent.children.includes(child)) {
        if (leftEnd) {
            parent.children.unshift(child);
        } else {
            parent.children.push(child);
        }
    }
}

function disconnectNodes(parent: TreeNode, child: TreeNode) {
    let ind = parent.children.indexOf(child);
    if (ind != -1) {
        parent.children.splice(ind, 1);
    }
}

interface Measurable {
    measure(): number;
}

interface Cloneable<T> {
    clone(): T;
}

class Digit<T extends Measurable & Cloneable<any>> implements Measurable, Cloneable<Digit<T>> {
    arr: T[];
    measureVal: number;

    constructor(arr: T[] = []) {
        this.arr = arr;
        this.measureVal = 0;
        this.arr.forEach(el => this.measureVal += el.measure())
    }

    clone(): Digit<T> {
        let out: Digit<T> = new Digit<T>();
        this.arr.forEach(el => {
            out.push(el.clone());
        });
        return out;
    }

    split(target: number, val: number): [T[], T, T[]] {
        let out1 = [];
        let out2 = [];
        let accum = val;
        while (this.length() > 1 && accum + this.arr[0].measure() < target) {
            let cur = this.shift();
            out1.push(cur);
            accum += cur.measure();
        }
        while (this.length() > 1) {
            out2.unshift(this.pop());
        }
        return [out1, this.shift(), out2];
    }

    measure(): number {
        return this.measureVal;
    }

    push(el: T): void {
        this.arr.push(el);
        this.measureVal += el.measure();
    }

    unshift(el: T): void {
        this.arr.unshift(el);
        this.measureVal += el.measure();
    }

    pop(): T {
        let out = this.arr.pop();
        this.measureVal -= out.measure();
        return out;
    }

    shift(): T {
        let out = this.arr.shift();
        this.measureVal -= out.measure();
        return out;
    }

    length(): number {
        return this.arr.length;
    }

    clear(): void {
        this.arr.length = 0;
        this.measureVal = 0;
    }
}

class FingerTree<T extends Measurable & Cloneable<any>> implements Measurable, Cloneable<FingerTree<T>> {
    head: Digit<T>;
    tail: Digit<T>;
    child: FingerTree<Digit<T>>;
    measureVal: number;

    constructor() {
        this.head = new Digit<T>();
        this.tail = new Digit<T>();
        this.child = null;
        this.measureVal = 0;
    }

    clone(): FingerTree<T> {
        let out: FingerTree<T> = this.createTree();
        out.head = this.head.clone();
        out.tail = this.tail.clone();
        if (this.child) {
            out.child = this.child.clone();
        }
        out.measureVal = this.measureVal;
        return out;
    }

    addr(el: T): void {
        if (this.isEmpty()) {
            this.head.push(el);
        } else if (this.isSingle()) {
            this.getChild();
            this.tail.push(el);
            this.measureVal += el.measure();
        } else if (this.tail.length() == 4) {
            let last = this.tail.pop();
            this.getChild().addr(this.tail);
            this.tail = new Digit<T>([last, el]);
        } else {
            this.tail.push(el);
        }
        this.recomputeMeasure();
    }

    addl(el: T): void {
        if (this.isEmpty()) {
            this.head.push(el);
        } else if (this.isSingle()) {
            this.getChild();
            this.tail.push(this.head.shift());
            this.head.push(el);
        } else if (this.head.length() == 4) {
            let first = this.head.shift();
            this.getChild().addl(this.head);
            this.head = new Digit<T>([el, first]);
        } else {
            this.head.unshift(el);
        }
        this.recomputeMeasure();
    }

    removel(): T {
        if (this.isEmpty()) {
            return null;
        }
        if (this.isSingle()) {
            return this.head.pop();
        }
        let out = this.head.shift();
        this.deeplify();
        if (this.isSingle()) {
            this.child = null;
        }
        this.recomputeMeasure();
        return out;
    }

    remover(): T {
        if (this.isEmpty()) {
            return null;
        }
        if (this.isSingle()) {
            return this.head.pop();
        }
        let out = this.tail.pop();
        this.deeprify();
        if (this.isSingle()) {
            this.child = null;
        }
        this.recomputeMeasure();
        return out;
    }

    deeplify(): void {
        if (!this.head.length()) {
            let sub: Digit<T> = this.getChild().removel();
            if (!sub) {
                let oldTail = this.tail.arr.map(el => el);
                this.tail.clear();
                oldTail.forEach(el => this.addl(el));
            } else {
                this.head = sub;
            }
        }
    }

    deeprify(): void {
        if (!this.tail.length()) {
            let sub: Digit<T> = this.getChild().remover();
            if (!sub) {
                let oldHead = this.head.arr.map(el => el);
                this.head.clear();
                oldHead.forEach(el => this.addr(el));
            } else {
                this.tail = sub;
            }
        }
    }

    concat(other: FingerTree<T>): void {
        this.concatGeneral([], other);
    }

    // other will be emptied and be unusable after this
    concatGeneral(arr: T[], other: FingerTree<T>): void {
        if (this.isEmpty()) {
            this.head = other.head;
            this.tail = other.tail;
            this.child = other.child;
            other.clear();
            arr.forEach(el => this.addl(el));
        } else if (other.isEmpty()) {
            arr.forEach(el => this.addr(el));
        } else if (this.isSingle()) {
            let firstEl = this.head.shift();
            this.head = other.head;
            this.tail = other.tail;
            this.child = other.child;
            other.clear();
            arr.forEach(el => this.addl(el));
            this.addl(firstEl);
        } else if (other.isSingle()) {
            arr.forEach(el => this.addr(el));
            this.addr(other.head.shift());
            other.clear();
        } else {
            this.child.concatGeneral(this.nodes(this.tail, new Digit<T>(arr), other.head), other.child);
            this.tail = other.tail;
            other.clear();
        }
        this.recomputeMeasure();
    }

    split(target: number, val: number): [T, FingerTree<T>] {
        if (this.isSingle()) {
            let out = this.head.pop();
            this.recomputeMeasure();
            return [out, this.createTree()];
        } else if (val + this.head.measure() >= target) {
            let [l, x, r] = this.head.split(target, val);
            let m = this.child;
            this.child = null;
            let oldTail = this.tail;
            this.tail = new Digit<T>();
            while (l.length) {
                this.addr(l.pop());
            }
            let outTree = this.createTree();
            outTree.head = new Digit<T>(r);
            outTree.child = m;
            outTree.tail = oldTail;
            outTree.deeplify();
            if (outTree.isEmpty() || outTree.isSingle()) {
                outTree.child = null;
            }
            this.recomputeMeasure();
            outTree.recomputeMeasure();
            return [x, outTree];
        } else if (val + this.head.measure() + this.child.measure() >= target) {
            let [xs, mr] = this.child.split(target, val + this.head.measure());
            let [l, x, r] = xs.split(target, val + this.head.measure() + this.child.measure());
            let oldTail = this.tail;
            this.tail = new Digit<T>();
            while (l.length) {
                this.tail.unshift(l.pop());
            }
            this.deeprify();
            if (this.isEmpty() || this.isSingle()) {
                this.child = null;
            }
            let outTree = this.createTree();
            outTree.head = new Digit<T>(r);
            outTree.child = mr;
            outTree.tail = oldTail;
            outTree.deeplify();
            if (outTree.isEmpty() || outTree.isSingle()) {
                outTree.child = null;
            }
            this.recomputeMeasure();
            outTree.recomputeMeasure();
            return [x, outTree];
        } else {
            let [l, x, r] = this.tail.split(target, val + this.head.measure() + this.child.measure());
            while (l.length) {
                this.tail.unshift(l.pop());
            }
            this.deeprify();
            if (this.isEmpty() || this.isSingle()) {
                this.child = null;
            }
            let outTree = this.createTree();
            while (r.length) {
                outTree.addr(r.shift());
            }
            if (outTree.isEmpty() || outTree.isSingle()) {
                outTree.child = null;
            }
            this.recomputeMeasure();
            outTree.recomputeMeasure();
            return [x, outTree];
        }
    }

    splitComplete(target: number, val: number): FingerTree<T> {
        if (this.isEmpty()) {
            return this.createTree();
        }
        if (target - val <= this.measure()) {
            let [x, r] = this.split(target, val);
            this.addr(x);
            return r;
        }
        return this.createTree();
    }

    measure(): number {
        return this.measureVal;
    }

    nodes(...inNodes: Digit<T>[]): Digit<T>[] {
        let arr: T[] = inNodes.flatMap(n => n.arr);
        let out: Digit<T>[] = [];
        let ind = 0;
        while (ind < arr.length) {
            if (arr.length - ind <= 3) {
                out.push(new Digit<T>(arr.slice(ind, arr.length)));
                ind = arr.length;
            } else if (arr.length - ind == 4) {
                out.push(new Digit<T>(arr.slice(ind, ind+2)));
                out.push(new Digit<T>(arr.slice(ind+2, arr.length)));
                ind = arr.length;
            } else {
                out.push(new Digit<T>(arr.slice(ind, ind+3)));
                ind += 3;
            }
        }
        return out;
    }

    recomputeMeasure(): void {
        this.measureVal = this.head.measure() + (this.child ? this.child.measure() : 0) + this.tail.measure();
    }

    clear(): void {
        this.head = new Digit<T>();
        this.tail = new Digit<T>();
        this.child = null;
    }

    isEmpty(): boolean {
        return this.head.length() == 0;
    }

    isSingle(): boolean {
        return this.head.length() == 1 && this.tail.length() == 0;
    }

    getChild(): FingerTree<Digit<T>> {
        if (!this.child) {
            this.child = new FingerTree<Digit<T>>();
        }
        return this.child;
    }

    createTree(): FingerTree<T> {
        return new FingerTree<T>();
    }

    createSubTree(): FingerTree<Digit<T>> {
        return new FingerTree<Digit<T>>();
    }
}

class VisualizedFingerTree<T extends Measurable & Cloneable<any>> extends FingerTree<T> {
    prevTail: Digit<T>[] = [];
    prevHead: Digit<T>[] = [];

    constructor() {
        super();
    }

    clone(): VisualizedFingerTree<T> {
        let out = super.clone() as VisualizedFingerTree<T>;
        out.deepConnectTreeNodes();
        return out;
    }

    disconnectTreeNodes(): void {
        this.head.arr.forEach(el => {
            disconnectNodes(getNode(this, true), getNode(el, false));
            disconnectNodes(getNode(this.head, true), getNode(el, false));
        });
        this.tail.arr.forEach(el => {
            disconnectNodes(getNode(this, true), getNode(el, false));
            disconnectNodes(getNode(this.tail, true), getNode(el, false));
        });
        if (this.child) {
            disconnectNodes(getNode(this.child, true), getNode(this.head, true));
            disconnectNodes(getNode(this.child, true), getNode(this.tail, true));
            disconnectNodes(getNode(this.child.head, true), getNode(this.head, true));
            disconnectNodes(getNode(this.child.tail, true), getNode(this.tail, true));
        }
        this.prevTail.push(this.tail);
        this.prevHead.push(this.head);
    }

    connectTreeNodes(): void {
        let curPrevTail = this.prevTail.pop();
        let curPrevHead = this.prevHead.pop();

        this.head.arr.forEach(el => {
            if (this.isEmpty() || this.isSingle()) {
                connectNodes(getNode(this, true), getNode(el, false));
            } else {
                connectNodes(getNode(this.head, true), getNode(el, false));
            }
        });
        this.tail.arr.forEach(el => connectNodes(getNode(this.tail, true), getNode(el, false)));
        if (curPrevHead && this.head != curPrevHead) {
            curPrevHead.arr.forEach(el => {
                connectNodes(getNode(curPrevHead, false), getNode(el, false));
            });
        }
        if (curPrevTail && this.tail != curPrevTail) {
            curPrevTail.arr.forEach(el => {
                connectNodes(getNode(curPrevTail, false), getNode(el, false));
            });
        }

        if (this.child) {
            if (this.child.isEmpty() || this.child.isSingle()) {
                connectNodes(getNode(this.child, true), getNode(this.head, true), true);
                connectNodes(getNode(this.child, true), getNode(this.tail, true));
            } else {
                connectNodes(getNode(this.child.head, true), getNode(this.head, true), true);
                connectNodes(getNode(this.child.tail, true), getNode(this.tail, true));
            }
        }
    }

    deepConnectTreeNodes(): void {
        this.connectTreeNodes();
        this.head.arr.forEach(el => {
            this.deepConnectDigitNodes(el);
        });
        this.tail.arr.forEach(el => {
            this.deepConnectDigitNodes(el);
        });
    }

    deepConnectDigitNodes(input: any): void {
        if (input instanceof Digit) {
            input.arr.forEach(el => {
                connectNodes(getNode(input, false), getNode(el, false));
                this.deepConnectDigitNodes(el);
            });
        }
    }

    getRootTreeNode(): TreeNode {
        if (!this.child) {
            return getNode(this, true);
        }
        return (this.child as VisualizedFingerTree<Digit<T>>).getRootTreeNode();
    }

    addr(el: T): void {
        this.disconnectTreeNodes();
        super.addr(el);
        this.connectTreeNodes();
    }

    addl(el: T): void {
        this.disconnectTreeNodes();
        super.addl(el);
        this.connectTreeNodes();
    }

    removel(): T {
        this.disconnectTreeNodes();
        let out = super.removel();
        this.connectTreeNodes();
        return out;
    }

    remover(): T {
        this.disconnectTreeNodes();
        let out = super.remover();
        this.connectTreeNodes();
        return out;
    }

    concatGeneral(arr: T[], other: VisualizedFingerTree<T>): void {
        this.disconnectTreeNodes();
        other.disconnectTreeNodes();
        super.concatGeneral(arr, other);
        this.connectTreeNodes();
    }

    nodes(...arr: Digit<T>[]): Digit<T>[] {
        arr.forEach(node =>
            node.arr.forEach(el => disconnectNodes(getNode(node, false), getNode(el, false))));
        let out = super.nodes(...arr);
        out.forEach(node =>
            node.arr.forEach(el => connectNodes(getNode(node, false), getNode(el, false))));
        return out;
    }

    split(target: number, val: number): [T, VisualizedFingerTree<T>] {
        this.disconnectTreeNodes();
        let out = super.split(target, val);
        let [out1, out2] = out;
        this.connectTreeNodes();
        (out2 as VisualizedFingerTree<T>).connectTreeNodes();
        return out as [T, VisualizedFingerTree<T>];
    }

    splitComplete(target: number, val: number): VisualizedFingerTree<T> {
        return super.splitComplete(target, val) as VisualizedFingerTree<T>;
    }

    getChild(): FingerTree<Digit<T>> {
        if (!this.child) {
            this.child = new VisualizedFingerTree<Digit<T>>();
        }
        return this.child;
    }

    createTree(): VisualizedFingerTree<T> {
        return new VisualizedFingerTree<T>();
    }

    createSubTree(): VisualizedFingerTree<Digit<T>> {
        return new VisualizedFingerTree<Digit<T>>();
    }
}

class FingerEl implements Measurable, Cloneable<FingerEl> {
    val: number;

    constructor(val: number) {
        this.val = val;
    }

    measure(): number {
        return this.val;
    }

    clone(): FingerEl {
        return new FingerEl(this.val);
    }
}

class D3Tree {
    root: d3.HierarchyNode<TreeNode>;
    treeLayout: d3.TreeLayout<TreeNode>;
    fingerTree: VisualizedFingerTree<FingerEl>;
    treeData: TreeNode;
    limits: [number, number];

    constructor(index: number, tree: VisualizedFingerTree<FingerEl> = null) {
        if (!tree) {
            this.fingerTree = new VisualizedFingerTree<FingerEl>();
            for (let i=0; i<1; i++) {
                this.fingerTree.addl(new FingerEl(1));
            }
        } else {
            this.fingerTree = tree;
        }

        this.treeData = this.fingerTree.getRootTreeNode();
        this.root = d3.hierarchy(this.treeData);
        this.treeLayout = d3.tree<TreeNode>().size([height, width]);

        this.treeLayout(this.root);
        this.limits = this.setRelativeHeights(this.root, 0, true);
        this.adjustPositions(this.root, index);
    }

    update(index: number): void {
        this.treeData = this.fingerTree.getRootTreeNode();
        this.root = d3.hierarchy(this.treeData);
        this.treeLayout(this.root);
        this.limits = this.setRelativeHeights(this.root, 0, true);
        this.adjustPositions(this.root, index);
    }

    getDepth(node: d3.HierarchyNode<TreeNode>) : number {
        if (!node.children) {
            return 0;
        }
        let depths = node.children.map(c => 1 + this.getDepth(c));
        return Math.max(...depths);
    }

    setRelativeHeights(node: d3.HierarchyNode<TreeNode>, curHeight: number, isRoot: boolean) : [number, number] {
        node.data.relativeHeight = curHeight;
        let out : [number, number] = [curHeight, curHeight];
        if (node.children) {
            for (let i=0; i < node.children.length; i++) {
                let child = node.children[i];
                let accum : [number, number];
                if (child.data.isFingerTree) {
                    accum = this.setRelativeHeights(child, curHeight-2, false);
                } else {
                    accum = this.setRelativeHeights(child, curHeight+3, false);
                }
                out = [Math.min(out[0], accum[0]), Math.max(out[1], accum[1])];
            }
        }
        return out;
    }

    adjustPositions(node: d3.HierarchyNode<TreeNode>, index: number): void {
        node.y = heightMargin + (node.data.relativeHeight - this.limits[0]) * (height - 2*heightMargin) / (this.limits[1] - this.limits[0]);
        node.x += index * offset;
        if (node.children) {
            node.children.forEach(c => this.adjustPositions(c, index));
        }
    }
}

class D3View {
    static idCounter: number = 0;

    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
    d3Trees: D3Tree[];

    constructor() {
        this.svg =
            d3.select("body").append("svg")
                .attr("width", width)
                .attr("height", width);
        this.d3Trees = [];

        document.getElementById('addtree').addEventListener('click', () => this.addTree());
        document.getElementById('concat').addEventListener('click', () => {
            if (this.d3Trees.length >= 2) {
                this.d3Trees[0].fingerTree.concat(this.d3Trees[1].fingerTree)
                document.getElementById("buttons" + (this.d3Trees.length-1)).remove();
                this.d3Trees.splice(1,1);
            }
            this.updateAll();
        });
        const slider: HTMLInputElement = document.getElementById('slider') as HTMLInputElement;
        const sliderValue = document.getElementById('sliderValue') as HTMLInputElement;
        let previousVal = 10;
        sliderValue.addEventListener('input', () => {
            const value = parseInt(sliderValue.value);
            if (!isNaN(value)) {
                slider.value = value.toString();
                previousVal = value;
            } else if (sliderValue.value.length){
                sliderValue.value = previousVal.toString();
            }}
        );
        slider.addEventListener('input', () => { sliderValue.value = slider.value; });
        document.getElementById('clone').addEventListener('click', () => {
            let other = this.d3Trees[0].fingerTree.clone();
            let d3Tree = new D3Tree(1, other);
            this.d3Trees.splice(1, 0, d3Tree);
            this.addButtonSet(1);
            this.updateAll();
        });
        document.getElementById('split').addEventListener('click', () => {
            let splitVal = parseInt(slider.value);
            if (splitVal > 0 && this.d3Trees[0].fingerTree.measure() > splitVal) {
                let other = this.d3Trees[0].fingerTree.splitComplete(splitVal, 0);
                let d3Tree = new D3Tree(1, other);
                this.d3Trees.splice(1, 0, d3Tree);
                this.addButtonSet(1);
                this.updateAll();
            }
        });

        this.addTree();
    }

    addTree(): void {
        let ind = this.d3Trees.length;
        let d3Tree = new D3Tree(ind);
        this.d3Trees.push(d3Tree);
        this.addButtonSet(ind);
        this.update(ind);
    }

    addButtonSet(start: number): void {
        for (let ind=start; ind < this.d3Trees.length; ind++) {
            const buttons = document.getElementById('buttons');
            let buttonsDiv = document.getElementById(`buttons${ind}`);
            if (!buttonsDiv) {
                buttons.insertAdjacentHTML('beforeend', `<div id="buttons${ind}"></div>`);
                buttonsDiv = document.getElementById(`buttons${ind}`);
            }
            let buttonsHtml = [`<button id=\"addleft${ind}\" style=\"width: ${buttonWidth}px; height: ${buttonHeight}px; font-size: 20px;\">Add Left</button>`,
                `<button id=\"addright${ind}\" style=\"width: ${buttonWidth}px; height: ${buttonHeight}px; font-size: 20px;\">Add Right</button>`,
                `<button id=\"removeleft${ind}\" style=\"width: ${buttonWidth}px; height: ${buttonHeight}px; font-size: 20px;\">Remove Left</button>`,
                `<button id=\"removeright${ind}\" style=\"width: ${buttonWidth}px; height: ${buttonHeight}px; font-size: 20px;\">Remove Right</button>`];
            buttonsDiv.innerHTML = buttonsHtml.join("\n");

            let addleftbutton = document.getElementById(`addleft${ind}`);
            let addrightbutton = document.getElementById(`addright${ind}`);
            let removeleftbutton = document.getElementById(`removeleft${ind}`);
            let removerightbutton = document.getElementById(`removeright${ind}`);

            addleftbutton.addEventListener('click', () => {
                this.d3Trees[ind].fingerTree.addl(new FingerEl(1));
                this.update(ind);
            });

            addrightbutton.addEventListener('click', () => {
                this.d3Trees[ind].fingerTree.addr(new FingerEl(1));
                this.update(ind);
            });

            removeleftbutton.addEventListener('click', () => {
                if (!this.d3Trees[ind].fingerTree.isEmpty() && !this.d3Trees[ind].fingerTree.isSingle()) {
                    this.d3Trees[ind].fingerTree.removel();
                }
                this.update(ind);
            });

            removerightbutton.addEventListener('click', () => {
                if (!this.d3Trees[ind].fingerTree.isEmpty() && !this.d3Trees[ind].fingerTree.isSingle()) {
                    this.d3Trees[ind].fingerTree.remover();
                }
                this.update(ind);
            });
        }
    }

    updateAll(): void {
        for (let i=0; i<this.d3Trees.length; i++) {
            this.update(i);
        }
    }

    update(ind: number): void {
        this.d3Trees[ind].update(ind);

        const nodes = this.svg.selectAll('circle')
            .data(this.d3Trees.map(tree => tree.root.descendants()).flat(1),  (d: d3.HierarchyNode<TreeNode>) => d.data.id || (d.data.id = ++D3View.idCounter));

        const links = this.svg.selectAll('line')
            .data(this.d3Trees.map(tree => tree.root.links()).flat(1), (d: d3.HierarchyLink<TreeNode>) => d.target.data.id);

        const nodeEnter = nodes.enter().append('circle')
            .attr('r', nodeSize)
            .attr('cx', d => d.x + 50)
            .attr('cy', d => d.y + 50)

        const linkEnter = links.enter().append('line')
            .attr('x1', d => d.source.x + 50)
            .attr('y1', d => d.source.y + 50)
            .attr('x2', d => d.target.x + 50)
            .attr('y2', d => d.target.y + 50)
            .attr('stroke', 'black');

        nodes.transition()
            .duration(transitionDuration)
            .attr('cx', d => d.x + 50)
            .attr('cy', d => d.y + 50);

        links.transition()
            .duration(transitionDuration)
            .attr('x1', d => d.source.x + 50)
            .attr('y1', d => d.source.y + 50)
            .attr('x2', d => d.target.x + 50)
            .attr('y2', d => d.target.y + 50);

        nodes.exit().remove();
        links.exit().remove();
    }
}

let d3View: D3View = new D3View();